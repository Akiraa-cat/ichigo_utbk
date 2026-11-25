
/**
 * UTBK STUDY JOURNAL
 * Google Apps Script Web App
 *
 * Database layout:
 * Row 1-3 : Title / description / notes
 * Row 4   : Column headers
 * Row 5+  : Database records
 *
 * Timezone: Asia/Jakarta
 */

const CONFIG = {
  HEADER_ROW: 4,
  DATA_START_ROW: 5,
  TIMEZONE: 'Asia/Jakarta',

  SHEETS: {
    settings: 'settings',
    applications: 'applications',
    tryouts: 'tryout_scores',
    sessions: 'study_sessions',
    sessionSubtests: 'study_session_subtests',
    activityTypes: 'activity_types',
    schedules: 'schedule_entries',
    notes: 'notes',
    noteSubtests: 'note_subtests'
  },

  ID_FIELDS: {
    applications: 'application_id',
    tryouts: 'tryout_id',
    sessions: 'session_id',
    sessionSubtests: 'session_subtest_id',
    schedules: 'schedule_id',
    notes: 'note_id',
    noteSubtests: 'note_subtest_id'
  },

  SUBTESTS: ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM'],
  NOTE_CATEGORIES: ['UTBK', 'RANDOM'],
  NOTES_DEFAULT_PER_PAGE: 10,
  NOTES_MAX_PER_PAGE: 50,
  IDEMPOTENCY_SHEET: '_request_ledger'
};
const IDEMPOTENCY_HEADERS = [
  'request_id',
  'action',
  'payload_hash',
  'status',
  'entity_id',
  'created_at',
  'updated_at'
];


/* =====================================================
   1. WEB APP ENTRY POINTS
===================================================== */

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function handleRequest_(e, method) {
  try {
    let payload = {};

    if (method === 'GET') {
      payload = e && e.parameter ? e.parameter : {};
    } else {
      const raw = e && e.postData ? e.postData.contents : '{}';
      payload = JSON.parse(raw || '{}');
    }

    const action = String(payload.action || '').trim();

    if (!action) {
      throw new Error('Action is required.');
    }

    const result = routeAction_(action, payload);

    return jsonResponse_({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


/* =====================================================
   2. ACTION ROUTER
===================================================== */

function routeAction_(action, p) {
  switch (action) {

    case 'health':
      return {
        status: 'ok',
        application: 'UTBK Study Journal',
        timezone: getTimezone_()
      };

    case 'getSettings':
      return getSettings_();

    case 'saveSettings':
      return withWriteIdempotency_(
        'saveSettings',
        p.request_id,
        p.settings || {},
        () => saveSettings_(p.settings || {})
      );

    case 'listApplications':
      return listRecords_('applications');

    case 'saveApplication':
      return saveRecordAction_('saveApplication', 'applications', p);

    case 'deleteApplication':
      return withWriteIdempotency_(
        'deleteApplication',
        p.request_id,
        { application_id: p.application_id },
        () => deleteRecordIfExists_('applications', p.application_id)
      );

    case 'listTryouts':
      return listRecords_('tryouts');

    case 'saveTryout':
      return saveRecordAction_('saveTryout', 'tryouts', p);

    case 'deleteTryout':
      return withWriteIdempotency_(
        'deleteTryout',
        p.request_id,
        { tryout_id: p.tryout_id },
        () => deleteRecordIfExists_('tryouts', p.tryout_id)
      );

    case 'listSessions':
      return listSessions_(p);

    case 'saveSession':
      return withWriteIdempotency_(
        'saveSession',
        p.request_id,
        p.data || {},
        requestId => saveSession_(p.data || {}, requestId, true)
      );

    case 'deleteSession':
      return withWriteIdempotency_(
        'deleteSession',
        p.request_id,
        { session_id: p.session_id },
        () => deleteSessionIfExists_(p.session_id)
      );

    case 'listActivityTypes':
      return listRecords_('activityTypes');

    case 'listSchedule':
      return listSchedule_(p);

    case 'saveScheduleEntry':
      return withWriteIdempotency_(
        'saveScheduleEntry',
        p.request_id,
        p.data || {},
        requestId => saveScheduleEntry_(p.data || {}, requestId)
      );

    case 'deleteScheduleEntry':
      return withWriteIdempotency_(
        'deleteScheduleEntry',
        p.request_id,
        { schedule_id: p.schedule_id },
        () => deleteRecordIfExists_('schedules', p.schedule_id)
      );

    // MEMORI KESALAHAN
    case 'listNotes':
      return listNotes_(p);

    case 'getNote':
      return getNote_(p.note_id);

    case 'saveNote':
      return withWriteIdempotency_(
        'saveNote',
        p.request_id,
        p.data || {},
        requestId => saveNote_(p.data || {}, requestId, true)
      );

    case 'deleteNote':
      return withWriteIdempotency_(
        'deleteNote',
        p.request_id,
        { note_id: p.note_id },
        () => deleteNoteIfExists_(p.note_id)
      );

    default:
      throw new Error('Unknown action: ' + action);
  }
}


/* =====================================================
   3. SPREADSHEET HELPERS
===================================================== */

function getSpreadsheet_() {
  const id = PropertiesService
    .getScriptProperties()
    .getProperty('SPREADSHEET_ID');

  if (id) {
    return SpreadsheetApp.openById(id);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error(
      'Spreadsheet not found. Set SPREADSHEET_ID in Script Properties.'
    );
  }

  return active;
}

function getSheet_(key) {
  const name = CONFIG.SHEETS[key];

  if (!name) {
    throw new Error('Unknown sheet key: ' + key);
  }

  const sheet = getSpreadsheet_().getSheetByName(name);

  if (!sheet) {
    throw new Error('Sheet not found: ' + name);
  }

  return sheet;
}

function getHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    throw new Error('No headers found in ' + sheet.getName());
  }

  return sheet
    .getRange(CONFIG.HEADER_ROW, 1, 1, lastColumn)
    .getValues()[0]
    .map(value => String(value).trim());
}

function getRecords_(key) {
  const sheet = getSheet_(key);
  const headers = getHeaders_(sheet);
  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.DATA_START_ROW) {
    return [];
  }

  const rowCount = lastRow - CONFIG.DATA_START_ROW + 1;

  const values = sheet
    .getRange(
      CONFIG.DATA_START_ROW,
      1,
      rowCount,
      headers.length
    )
    .getValues();

  return values
    .filter(row => row.some(value => value !== '' && value !== null))
    .map(row => rowToObject_(headers, row));
}

function rowToObject_(headers, row) {
  const result = {};

  headers.forEach((header, index) => {
    result[header] = normalizeValue_(row[index], header);
  });

  return result;
}

function normalizeValue_(value, header) {
  if (!(value instanceof Date)) return value;

  const timezone = getTimezone_();

  if (header === 'start_time') {
    return Utilities.formatDate(value, timezone, 'HH:mm');
  }

  if ([
    'study_date',
    'tryout_date',
    'schedule_date',
    'note_date'
  ].includes(header)) {
    return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
  }

  if ([
    'created_at',
    'updated_at'
  ].includes(header)) {
    return Utilities.formatDate(
      value,
      timezone,
      "yyyy-MM-dd'T'HH:mm:ss"
    );
  }

  return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
}

function getTimezone_() {
  return PropertiesService
    .getScriptProperties()
    .getProperty('TIMEZONE') || CONFIG.TIMEZONE;
}

function findRecordRow_(sheet, idField, id) {
  if (!id) return -1;

  const headers = getHeaders_(sheet);
  const idIndex = headers.indexOf(idField);

  if (idIndex < 0) {
    throw new Error('ID column not found: ' + idField);
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < CONFIG.DATA_START_ROW) {
    return -1;
  }

  const values = sheet
    .getRange(
      CONFIG.DATA_START_ROW,
      idIndex + 1,
      lastRow - CONFIG.DATA_START_ROW + 1,
      1
    )
    .getValues();

  const index = values.findIndex(
    row => String(row[0]) === String(id)
  );

  return index < 0 ? -1 : index + CONFIG.DATA_START_ROW;
}

function appendRecord_(sheet, data) {
  const headers = getHeaders_(sheet);

  const row = headers.map(header => {
    return data[header] !== undefined ? data[header] : '';
  });

  sheet.appendRow(row);
}

function updateRecord_(sheet, rowNumber, data) {
  const headers = getHeaders_(sheet);

  const current = sheet
    .getRange(rowNumber, 1, 1, headers.length)
    .getValues()[0];

  const updated = headers.map((header, index) => {
    return data[header] !== undefined
      ? data[header]
      : current[index];
  });

  sheet
    .getRange(rowNumber, 1, 1, headers.length)
    .setValues([updated]);
}

function newId_() {
  return Utilities.getUuid();
}

function now_() {
  return Utilities.formatDate(
    new Date(),
    getTimezone_(),
    "yyyy-MM-dd'T'HH:mm:ss"
  );
}

function validateRequestId_(value) {
  const requestId = String(value || '').trim().toLowerCase();
  if (!requestId) return '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestId)) {
    throw new Error('request_id must be a UUID.');
  }
  return requestId;
}

function canonicalizeRequestPayload_(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalizeRequestPayload_);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = canonicalizeRequestPayload_(value[key]);
      return result;
    }, {});
  }
  return value;
}

function fingerprintRequest_(action, payload) {
  const serialized = JSON.stringify([
    action,
    canonicalizeRequestPayload_(payload)
  ]);
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    serialized,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest);
}

function getIdempotencySheet_() {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(CONFIG.IDEMPOTENCY_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.IDEMPOTENCY_SHEET);
    sheet
      .getRange(CONFIG.HEADER_ROW, 1, 1, IDEMPOTENCY_HEADERS.length)
      .setValues([IDEMPOTENCY_HEADERS]);
  } else {
    const range = sheet.getRange(
      CONFIG.HEADER_ROW,
      1,
      1,
      IDEMPOTENCY_HEADERS.length
    );
    const currentHeaders = range.getValues()[0].map(value => String(value).trim());

    if (currentHeaders.every(header => !header)) {
      range.setValues([IDEMPOTENCY_HEADERS]);
    } else if (currentHeaders.some((header, index) => header !== IDEMPOTENCY_HEADERS[index])) {
      throw new Error('Idempotency ledger headers are invalid.');
    }
  }

  const visibleSheets = spreadsheet.getSheets().filter(item => !item.isSheetHidden());
  if (!sheet.isSheetHidden() && visibleSheets.length > 1) {
    sheet.hideSheet();
  }

  return sheet;
}

function findIdempotencyRow_(sheet, requestId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return -1;

  const values = sheet
    .getRange(
      CONFIG.DATA_START_ROW,
      1,
      lastRow - CONFIG.DATA_START_ROW + 1,
      1
    )
    .getDisplayValues();
  const index = values.findIndex(row => String(row[0]) === requestId);
  return index < 0 ? -1 : index + CONFIG.DATA_START_ROW;
}

function saveRecordAction_(action, key, payload) {
  return withWriteIdempotency_(
    action,
    payload.request_id,
    payload.data || {},
    requestId => {
      const data = Object.assign({}, payload.data || {});
      const idField = CONFIG.ID_FIELDS[key];
      const isIdempotentCreate = Boolean(requestId && !data[idField]);

      if (isIdempotentCreate) data[idField] = requestId;
      return saveRecord_(key, data, isIdempotentCreate);
    }
  );
}

function getIdempotencyEntityId_(action, result) {
  const fields = {
    saveApplication: 'application_id',
    saveTryout: 'tryout_id',
    saveSession: 'session_id',
    saveScheduleEntry: 'schedule_id',
    saveNote: 'note_id',
    deleteApplication: 'id',
    deleteTryout: 'id',
    deleteSession: 'id',
    deleteScheduleEntry: 'id',
    deleteNote: 'note_id'
  };
  const field = fields[action];
  return field && result ? String(result[field] || '') : '';
}

function getIdempotentResult_(action, entityId) {
  if (action === 'saveSettings') return getSettings_();
  if (action.indexOf('delete') === 0) {
    return { deleted: true, id: entityId };
  }

  if (!entityId) {
    throw new Error('Completed idempotency record is missing its entity ID.');
  }

  if (action === 'saveNote') return getNote_(entityId);
  if (action === 'saveSession') {
    const session = listSessions_({}).find(item => item.session_id === entityId);
    if (session) return session;
  }

  const targets = {
    saveApplication: ['applications', 'application_id'],
    saveTryout: ['tryouts', 'tryout_id'],
    saveScheduleEntry: ['schedules', 'schedule_id']
  };
  const target = targets[action];
  if (target) {
    const record = getRecords_(target[0]).find(item => item[target[1]] === entityId);
    if (record) return record;
  }

  throw new Error('Completed idempotency result is no longer available.');
}

function withWriteIdempotency_(action, requestIdValue, payload, operation) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const requestId = validateRequestId_(requestIdValue);
    if (!requestId) return operation('');

    const sheet = getIdempotencySheet_();
    const fingerprint = fingerprintRequest_(action, payload);
    let row = findIdempotencyRow_(sheet, requestId);
    let createdAt = now_();

    if (row > 0) {
      const values = sheet
        .getRange(row, 1, 1, IDEMPOTENCY_HEADERS.length)
        .getValues()[0];
      const priorAction = String(values[1]);
      const priorFingerprint = String(values[2]);
      const status = String(values[3]);

      if (priorAction !== action || priorFingerprint !== fingerprint) {
        throw new Error('request_id sudah digunakan untuk payload yang berbeda.');
      }
      if (status === 'COMPLETE') {
        return getIdempotentResult_(action, String(values[4] || ''));
      }
      if (status !== 'PENDING') {
        throw new Error('Status request_id tidak valid; gunakan ID baru untuk operasi baru.');
      }
      createdAt = String(values[5] || createdAt);
    } else {
      row = Math.max(CONFIG.DATA_START_ROW, sheet.getLastRow() + 1);
      sheet.getRange(row, 1, 1, IDEMPOTENCY_HEADERS.length).setValues([[
        requestId,
        action,
        fingerprint,
        'PENDING',
        '',
        createdAt,
        createdAt
      ]]);
    }

    const result = operation(requestId);
    const entityId = getIdempotencyEntityId_(action, result);
    sheet.getRange(row, 4, 1, 4).setValues([[
      'COMPLETE',
      entityId,
      createdAt,
      now_()
    ]]);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function validateDate_(value, fieldName) {
  const text = String(value || '');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(fieldName + ' must use YYYY-MM-DD.');
  }

  const parts = text.split('-').map(Number);
  const date = new Date(
    Date.UTC(parts[0], parts[1] - 1, parts[2])
  );

  if (
    date.getUTCFullYear() !== parts[0] ||
    date.getUTCMonth() !== parts[1] - 1 ||
    date.getUTCDate() !== parts[2]
  ) {
    throw new Error(fieldName + ' is not a valid date.');
  }

  return text;
}

function validateTime_(value, fieldName) {
  const text = String(value || '');

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
    throw new Error(fieldName + ' must use HH:mm.');
  }

  return text;
}

function validateNumber_(value, fieldName, min, max) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(
      fieldName + ' must be between ' + min + ' and ' + max + '.'
    );
  }

  return number;
}


/* =====================================================
   4. GENERIC CRUD
===================================================== */

function listRecords_(key) {
  return getRecords_(key);
}

function saveRecord_(key, input, allowCreateWithId) {
  const sheet = getSheet_(key);
  const idField = CONFIG.ID_FIELDS[key];

  if (!idField) {
    throw new Error('ID configuration missing for ' + key);
  }

  const data = Object.assign({}, input);
  const currentTime = now_();

  if (key === 'applications') {
    if (!String(data.application_name || '').trim()) {
      throw new Error('application_name is required.');
    }

    const duplicate = getRecords_(key).find(item =>
      String(item.application_name || '').toLowerCase() ===
        String(data.application_name).trim().toLowerCase() &&
      item.application_id !== data.application_id
    );

    if (duplicate) {
      throw new Error('Application name already exists.');
    }
  }

  if (key === 'tryouts') {
    data.tryout_date = validateDate_(
      data.tryout_date,
      'tryout_date'
    );

    CONFIG.SUBTESTS.forEach(field => {
      data[field] = validateNumber_(data[field], field, 100, 1000);
    });

    if (data.overall_score !== undefined && data.overall_score !== '') {
      data.overall_score = validateNumber_(
        data.overall_score,
        'overall_score',
        100,
        1000
      );
    }

    if (!String(data.tryout_name || '').trim()) {
      throw new Error('tryout_name is required.');
    }
  }

  if (data[idField]) {
    const row = findRecordRow_(sheet, idField, data[idField]);

    if (row < 0 && !allowCreateWithId) {
      throw new Error('Record not found.');
    }

    if (row > 0) {
      data.updated_at = currentTime;
      updateRecord_(sheet, row, data);
    } else {
      data.created_at = currentTime;
      if (getHeaders_(sheet).includes('updated_at')) {
        data.updated_at = currentTime;
      }
      appendRecord_(sheet, data);
    }

  } else {
    data[idField] = newId_();
    data.created_at = currentTime;

    if (getHeaders_(sheet).includes('updated_at')) {
      data.updated_at = currentTime;
    }

    appendRecord_(sheet, data);
  }

  return data;
}

function deleteRecord_(key, id) {
  if (!id) throw new Error('Record ID is required.');

  const sheet = getSheet_(key);
  const idField = CONFIG.ID_FIELDS[key];
  const row = findRecordRow_(sheet, idField, id);

  if (row < 0) {
    throw new Error('Record not found.');
  }

  sheet.deleteRow(row);

  return {
    deleted: true,
    id: id
  };
}

function deleteRecordIfExists_(key, id) {
  if (!id) throw new Error('Record ID is required.');
  const sheet = getSheet_(key);
  const idField = CONFIG.ID_FIELDS[key];
  if (findRecordRow_(sheet, idField, id) < 0) {
    return { deleted: true, id: id };
  }
  return deleteRecord_(key, id);
}


/* =====================================================
   5. SETTINGS
===================================================== */

function getSettings_() {
  const records = getRecords_('settings');
  const settings = {};

  records.forEach(row => {
    settings[row.setting_key] = row.setting_value;
  });

  return settings;
}

function saveSettings_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Settings object is required.');
  }

  const sheet = getSheet_('settings');
  const headers = getHeaders_(sheet);
  const records = getRecords_('settings');

  const keyIndex = headers.indexOf('setting_key');
  const valueIndex = headers.indexOf('setting_value');
  const updatedIndex = headers.indexOf('updated_at');

  if (keyIndex < 0 || valueIndex < 0) {
    throw new Error('Required settings columns not found.');
  }

  Object.keys(input).forEach(key => {
    const row = records.findIndex(
      item => String(item.setting_key) === key
    );

    if (row < 0) {
      throw new Error('Unknown setting: ' + key);
    }

    const actualRow = row + CONFIG.DATA_START_ROW;

    sheet.getRange(actualRow, valueIndex + 1)
      .setValue(input[key]);

    if (updatedIndex >= 0) {
      sheet.getRange(actualRow, updatedIndex + 1)
        .setValue(now_());
    }
  });

  return getSettings_();
}


/* =====================================================
   6. STUDY SESSIONS
===================================================== */

function listSessions_(p) {
  const sessions = getRecords_('sessions');
  const relations = getRecords_('sessionSubtests');

  return sessions.map(session => {
    session.subtests = relations
      .filter(item => item.session_id === session.session_id)
      .map(item => item.subtest_code);

    return session;
  }).filter(session => {
    if (p.start_date && session.study_date < p.start_date) {
      return false;
    }

    if (p.end_date && session.study_date > p.end_date) {
      return false;
    }

    return true;
  });
}

function saveSession_(input, requestId, lockHeld) {
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(10000);

  try {
    const data = Object.assign({}, input);

    data.study_date = validateDate_(
      data.study_date,
      'study_date'
    );

    data.start_time = validateTime_(
      data.start_time,
      'start_time'
    );

    data.duration_minutes = validateNumber_(
      data.duration_minutes,
      'duration_minutes',
      1,
      1440
    );

    const subtests = Array.isArray(data.subtests)
      ? [...new Set(data.subtests)]
      : [];

    subtests.forEach(code => {
      if (!CONFIG.SUBTESTS.includes(code)) {
        throw new Error('Invalid subtest: ' + code);
      }
    });

    delete data.subtests;

    if (!data.session_id && requestId) data.session_id = requestId;
    const saved = saveRecord_('sessions', data, Boolean(requestId));
    const relationSheet = getSheet_('sessionSubtests');

    const existing = getRecords_('sessionSubtests')
      .filter(item => item.session_id === saved.session_id);

    existing.forEach(item => {
      const row = findRecordRow_(
        relationSheet,
        'session_subtest_id',
        item.session_subtest_id
      );

      if (row > 0) relationSheet.deleteRow(row);
    });

    subtests.forEach(code => {
      appendRecord_(relationSheet, {
        session_subtest_id: newId_(),
        session_id: saved.session_id,
        subtest_code: code,
        created_at: now_()
      });
    });

    saved.subtests = subtests;
    return saved;

  } finally {
    if (lock) lock.releaseLock();
  }
}

function deleteSession_(id, lockHeld) {
  if (!id) throw new Error('session_id is required.');

  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(10000);

  try {
    const relationSheet = getSheet_('sessionSubtests');

    const relations = getRecords_('sessionSubtests')
      .filter(item => item.session_id === id);

    relations.forEach(item => {
      const row = findRecordRow_(
        relationSheet,
        'session_subtest_id',
        item.session_subtest_id
      );

      if (row > 0) relationSheet.deleteRow(row);
    });

    return deleteRecord_('sessions', id);

  } finally {
    if (lock) lock.releaseLock();
  }
}

function deleteSessionIfExists_(id) {
  if (!id) throw new Error('session_id is required.');
  const exists = getRecords_('sessions').some(item => item.session_id === id);
  if (!exists) return { deleted: true, id: id };
  return deleteSession_(id, true);
}


/* =====================================================
   7. SCHEDULE
===================================================== */

function listSchedule_(p) {
  return getRecords_('schedules').filter(item => {
    if (p.start_date && item.schedule_date < p.start_date) {
      return false;
    }

    if (p.end_date && item.schedule_date > p.end_date) {
      return false;
    }

    return true;
  });
}

function saveScheduleEntry_(input, requestId) {
  const data = Object.assign({}, input);

  data.schedule_date = validateDate_(
    data.schedule_date,
    'schedule_date'
  );

  const validCodes = getRecords_('activityTypes')
    .filter(item => String(item.is_active).toUpperCase() !== 'FALSE')
    .map(item => item.activity_code);

  if (!validCodes.includes(data.activity_code)) {
    throw new Error('Invalid or inactive activity_code.');
  }

  const duplicate = getRecords_('schedules').find(item =>
    item.schedule_date === data.schedule_date &&
    item.activity_code === data.activity_code &&
    item.schedule_id !== data.schedule_id
  );

  if (duplicate) {
    throw new Error('This activity already exists on this date.');
  }

  if (!data.schedule_id && requestId) data.schedule_id = requestId;
  return saveRecord_('schedules', data, Boolean(requestId));
}


/* =====================================================
   8. MEMORI KESALAHAN - HELPERS
===================================================== */

function parseNoteContent_(content) {
  if (content === null || content === undefined || content === '') {
    throw new Error('Note content is required.');
  }

  let parsed = content;

  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new Error('Note content must be valid JSON.');
    }
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed) ||
    parsed.type !== 'doc'
  ) {
    throw new Error('Invalid rich text document format.');
  }

  const serialized = JSON.stringify(parsed);

  if (serialized.length > 45000) {
    throw new Error('Note content is too large.');
  }

  return serialized;
}

function validateNoteCategory_(category) {
  const value = String(category || '').toUpperCase();

  if (!CONFIG.NOTE_CATEGORIES.includes(value)) {
    throw new Error('Category must be UTBK or RANDOM.');
  }

  return value;
}

function validateNoteSubtests_(subtests) {
  if (!Array.isArray(subtests)) {
    throw new Error('Subtests must be an array.');
  }

  const unique = [...new Set(
    subtests.map(code => String(code).toUpperCase())
  )];

  unique.forEach(code => {
    if (!CONFIG.SUBTESTS.includes(code)) {
      throw new Error('Invalid subtest: ' + code);
    }
  });

  return unique;
}

function parseStoredNoteContent_(content) {
  if (!content) return null;

  if (typeof content === 'object') return content;

  try {
    return JSON.parse(String(content));
  } catch (error) {
    return null;
  }
}

function getNoteRelations_() {
  return getRecords_('noteSubtests');
}

function getNoteSubtests_(noteId, relations) {
  return (relations || getNoteRelations_())
    .filter(item => String(item.note_id) === String(noteId))
    .map(item => item.subtest_code);
}

function getTryoutById_(tryoutId) {
  if (!tryoutId) return null;

  return getRecords_('tryouts').find(item =>
    String(item.tryout_id) === String(tryoutId)
  ) || null;
}

function enrichNote_(note, relations, tryouts) {
  const result = Object.assign({}, note);

  result.content = parseStoredNoteContent_(note.content);
  result.subtests = getNoteSubtests_(note.note_id, relations);

  const tryout = (tryouts || []).find(item =>
    String(item.tryout_id) === String(note.tryout_id)
  );

  result.tryout = tryout ? {
    tryout_id: tryout.tryout_id,
    tryout_name: tryout.tryout_name,
    tryout_date: tryout.tryout_date
  } : null;

  return result;
}

function deleteNoteRelations_(noteId) {
  const sheet = getSheet_('noteSubtests');
  const records = getRecords_('noteSubtests')
    .filter(item => String(item.note_id) === String(noteId));

  const rows = records
    .map(item => findRecordRow_(
      sheet,
      'note_subtest_id',
      item.note_subtest_id
    ))
    .filter(row => row > 0)
    .sort((a, b) => b - a);

  rows.forEach(row => sheet.deleteRow(row));
}

function saveNoteRelations_(noteId, subtests) {
  const sheet = getSheet_('noteSubtests');

  deleteNoteRelations_(noteId);

  subtests.forEach(code => {
    appendRecord_(sheet, {
      note_subtest_id: newId_(),
      note_id: noteId,
      subtest_code: code,
      created_at: now_()
    });
  });
}


/* =====================================================
   9. MEMORI KESALAHAN - LIST & PAGINATION
===================================================== */

function listNotes_(p) {
  const page = Math.max(1, parseInt(p.page, 10) || 1);

  const requestedPerPage =
    parseInt(p.per_page, 10) || CONFIG.NOTES_DEFAULT_PER_PAGE;

  const perPage = Math.min(
    CONFIG.NOTES_MAX_PER_PAGE,
    Math.max(1, requestedPerPage)
  );

  const search = String(p.search || '')
    .trim()
    .toLowerCase();

  const category = String(p.category || '')
    .trim()
    .toUpperCase();

  const subtestCode = String(p.subtest_code || '')
    .trim()
    .toUpperCase();

  if (category && !CONFIG.NOTE_CATEGORIES.includes(category)) {
    throw new Error('Invalid note category.');
  }

  if (
    subtestCode &&
    !CONFIG.SUBTESTS.includes(subtestCode)
  ) {
    throw new Error('Invalid subtest filter.');
  }

  if (category === 'RANDOM' && subtestCode) {
    throw new Error('Random notes cannot be filtered by subtest.');
  }

  const notes = getRecords_('notes');
  const relations = getNoteRelations_();
  const tryouts = getRecords_('tryouts');

  let filtered = notes.filter(note => {
    if (category && note.category !== category) {
      return false;
    }

    if (subtestCode) {
      const subtests = getNoteSubtests_(note.note_id, relations);

      if (!subtests.includes(subtestCode)) {
        return false;
      }
    }

    if (search) {
      const contentText = String(note.content || '')
        .toLowerCase();

      const dateText = String(note.note_date || '')
        .toLowerCase();

      const tryout = tryouts.find(item =>
        String(item.tryout_id) === String(note.tryout_id)
      );

      const tryoutName = tryout
        ? String(tryout.tryout_name || '').toLowerCase()
        : '';

      const searchable = [
        contentText,
        dateText,
        String(note.category || '').toLowerCase(),
        tryoutName
      ].join(' ');

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  });

  filtered.sort((a, b) => {
    const dateCompare = String(b.note_date || '')
      .localeCompare(String(a.note_date || ''));

    if (dateCompare !== 0) return dateCompare;

    return String(b.created_at || '')
      .localeCompare(String(a.created_at || ''));
  });

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / perPage);

  const safePage = totalPages === 0
    ? 1
    : Math.min(page, totalPages);

  const startIndex = (safePage - 1) * perPage;

  const items = filtered
    .slice(startIndex, startIndex + perPage)
    .map(note => enrichNote_(note, relations, tryouts));

  return {
    items: items,
    current_page: safePage,
    per_page: perPage,
    total_items: totalItems,
    total_pages: totalPages
  };
}


/* =====================================================
   10. MEMORI KESALAHAN - GET DETAIL
===================================================== */

function getNote_(noteId) {
  if (!noteId) {
    throw new Error('note_id is required.');
  }

  const note = getRecords_('notes').find(item =>
    String(item.note_id) === String(noteId)
  );

  if (!note) {
    throw new Error('Note not found.');
  }

  return enrichNote_(
    note,
    getNoteRelations_(),
    getRecords_('tryouts')
  );
}


/* =====================================================
   11. MEMORI KESALAHAN - CREATE & UPDATE
===================================================== */

function saveNote_(input, requestId, lockHeld) {
  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(10000);

  try {
    const data = Object.assign({}, input);

    data.note_date = validateDate_(
      data.note_date,
      'note_date'
    );

    data.category = validateNoteCategory_(data.category);
    data.content = parseNoteContent_(data.content);

    let subtests = Array.isArray(data.subtests)
      ? validateNoteSubtests_(data.subtests)
      : [];

    data.tryout_id = String(data.tryout_id || '').trim();

    if (data.category === 'RANDOM') {
      subtests = [];
      data.tryout_id = '';
    }

    if (data.tryout_id) {
      const tryout = getTryoutById_(data.tryout_id);

      if (!tryout) {
        throw new Error('Selected Try Out does not exist.');
      }
    }

    delete data.subtests;

    const sheet = getSheet_('notes');
    const currentTime = now_();

    let saved;

    if (data.note_id) {
      const row = findRecordRow_(
        sheet,
        'note_id',
        data.note_id
      );

      if (row < 0) {
        throw new Error('Note not found.');
      }

      data.updated_at = currentTime;

      updateRecord_(sheet, row, data);

      saved = Object.assign({}, data);

    } else {
      data.note_id = requestId || newId_();
      data.created_at = currentTime;
      data.updated_at = currentTime;

      appendRecord_(sheet, data);

      saved = Object.assign({}, data);
    }

    saveNoteRelations_(saved.note_id, subtests);

    saved.subtests = subtests;

    return enrichNote_(
      saved,
      getNoteRelations_(),
      getRecords_('tryouts')
    );

  } finally {
    if (lock) lock.releaseLock();
  }
}


/* =====================================================
   12. MEMORI KESALAHAN - DELETE
===================================================== */

function deleteNote_(noteId, lockHeld) {
  if (!noteId) {
    throw new Error('note_id is required.');
  }

  const lock = lockHeld ? null : LockService.getScriptLock();
  if (lock) lock.waitLock(10000);

  try {
    const sheet = getSheet_('notes');

    const row = findRecordRow_(
      sheet,
      'note_id',
      noteId
    );

    if (row < 0) {
      throw new Error('Note not found.');
    }

    deleteNoteRelations_(noteId);
    sheet.deleteRow(row);

    return {
      deleted: true,
      note_id: noteId
    };

  } finally {
    if (lock) lock.releaseLock();
  }
}

function deleteNoteIfExists_(noteId) {
  if (!noteId) throw new Error('note_id is required.');
  const exists = getRecords_('notes').some(item => item.note_id === noteId);
  if (!exists) return { deleted: true, note_id: noteId };
  return deleteNote_(noteId, true);
}

/* =====================================================
   13. INITIAL SETUP CHECK
===================================================== */

function setupCheck() {
  const spreadsheet = getSpreadsheet_();

  const requiredSheets = Object.values(CONFIG.SHEETS);

  const missing = requiredSheets.filter(
    name => !spreadsheet.getSheetByName(name)
  );

  if (missing.length) {
    throw new Error('Missing sheets: ' + missing.join(', '));
  }

  requiredSheets.forEach(name => {
    const sheet = spreadsheet.getSheetByName(name);
    const headers = getHeaders_(sheet);

    if (!headers.length || headers.every(h => !h)) {
      throw new Error('Missing headers in sheet: ' + name);
    }
  });

  return {
    success: true,
    spreadsheet: spreadsheet.getName(),
    sheets_checked: requiredSheets.length,
    sheets: requiredSheets,
    message: 'Database structure looks good.'
  };
}
