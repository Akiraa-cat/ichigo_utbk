
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
    schedules: 'schedule_entries'
  },

  ID_FIELDS: {
    applications: 'application_id',
    tryouts: 'tryout_id',
    sessions: 'session_id',
    sessionSubtests: 'session_subtest_id',
    schedules: 'schedule_id'
  },

  SUBTESTS: ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM']
};


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
      return saveSettings_(p.settings || {});

    case 'listApplications':
      return listRecords_('applications');

    case 'saveApplication':
      return saveRecord_('applications', p.data || {});

    case 'deleteApplication':
      return deleteRecord_('applications', p.application_id);

    case 'listTryouts':
      return listRecords_('tryouts');

    case 'saveTryout':
      return saveRecord_('tryouts', p.data || {});

    case 'deleteTryout':
      return deleteRecord_('tryouts', p.tryout_id);

    case 'listSessions':
      return listSessions_(p);

    case 'saveSession':
      return saveSession_(p.data || {});

    case 'deleteSession':
      return deleteSession_(p.session_id);

    case 'listActivityTypes':
      return listRecords_('activityTypes');

    case 'listSchedule':
      return listSchedule_(p);

    case 'saveScheduleEntry':
      return saveScheduleEntry_(p.data || {});

    case 'deleteScheduleEntry':
      return deleteRecord_('schedules', p.schedule_id);

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
    'schedule_date'
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

function saveRecord_(key, input) {
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

    if (row < 0) {
      throw new Error('Record not found.');
    }

    data.updated_at = currentTime;
    updateRecord_(sheet, row, data);

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

function saveSession_(input) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

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

    const saved = saveRecord_('sessions', data);
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
    lock.releaseLock();
  }
}

function deleteSession_(id) {
  if (!id) throw new Error('session_id is required.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

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
    lock.releaseLock();
  }
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

function saveScheduleEntry_(input) {
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

  return saveRecord_('schedules', data);
}


/* =====================================================
   8. INITIAL SETUP CHECK
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
