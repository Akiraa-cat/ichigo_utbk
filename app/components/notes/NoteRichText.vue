<script setup>
import { watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
} from '@lucide/vue'

const props = defineProps({
  modelValue: { type: Object, required: true },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2] } }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ],
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', currentEditor.getJSON())
  },
})

watch(() => props.editable, (editable) => {
  editor.value?.setEditable(editable)
})

watch(() => props.modelValue, (value) => {
  if (!editor.value || !value) return
  if (JSON.stringify(editor.value.getJSON()) !== JSON.stringify(value)) {
    editor.value.commands.setContent(value, { emitUpdate: false })
  }
})
</script>

<template>
  <div class="note-rich-text">
    <div v-if="editable" class="note-editor-toolbar" role="toolbar" aria-label="Format catatan">
      <button type="button" aria-label="Paragraf" title="Paragraf" :class="{ 'is-active': editor?.isActive('paragraph') }" @click="editor?.chain().focus().setParagraph().run()">
        <Pilcrow class="h-4 w-4" />
      </button>
      <button type="button" aria-label="Judul 1" title="Judul 1" :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()">
        <Heading1 class="h-4 w-4" />
      </button>
      <button type="button" aria-label="Judul 2" title="Judul 2" :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">
        <Heading2 class="h-4 w-4" />
      </button>
      <span class="note-toolbar-divider" />
      <button type="button" aria-label="Tebal" title="Tebal" :class="{ 'is-active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()">
        <Bold class="h-4 w-4" />
      </button>
      <button type="button" aria-label="Miring" title="Miring" :class="{ 'is-active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()">
        <Italic class="h-4 w-4" />
      </button>
      <span class="note-toolbar-divider" />
      <button type="button" aria-label="Daftar berpoin" title="Daftar berpoin" :class="{ 'is-active': editor?.isActive('bulletList') }" @click="editor?.chain().focus().toggleBulletList().run()">
        <List class="h-4 w-4" />
      </button>
      <button type="button" aria-label="Daftar bernomor" title="Daftar bernomor" :class="{ 'is-active': editor?.isActive('orderedList') }" @click="editor?.chain().focus().toggleOrderedList().run()">
        <ListOrdered class="h-4 w-4" />
      </button>
      <button type="button" aria-label="Checklist" title="Checklist" :class="{ 'is-active': editor?.isActive('taskList') }" @click="editor?.chain().focus().toggleTaskList().run()">
        <ListTodo class="h-4 w-4" />
      </button>
      <span class="note-toolbar-divider" />
      <button type="button" aria-label="Garis pemisah" title="Garis pemisah" @click="editor?.chain().focus().setHorizontalRule().run()">
        <Minus class="h-4 w-4" />
      </button>
    </div>
    <EditorContent
      :editor="editor"
      class="note-editor-content"
      :class="{ 'note-editor-readonly': !editable }"
    />
  </div>
</template>
