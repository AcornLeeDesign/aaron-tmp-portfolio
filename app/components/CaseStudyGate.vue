<script setup lang="ts">
import { CASE_STUDY_STORAGE_KEY } from '~/data/caseStudies'

const emit = defineEmits<{
  unlocked: []
}>()

const config = useRuntimeConfig()
const password = ref('')
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})

function submit() {
  error.value = ''
  const expected = String(config.public.caseStudyPassword ?? 'case')
  if (password.value.trim() === expected) {
    try {
      sessionStorage.setItem(CASE_STUDY_STORAGE_KEY, '1')
    } catch {
      // sessionStorage may be unavailable; still unlock this session in-memory via emit
    }
    emit('unlocked')
    return
  }
  error.value = 'Incorrect password'
  password.value = ''
  nextTick(() => inputRef.value?.focus())
}
</script>

<template>
  <div class="gate">
    <form class="gate__form" @submit.prevent="submit">
      <label class="gate__label" for="case-study-password">
        Enter password to view this case study
      </label>
      <div class="gate__row">
        <input
          id="case-study-password"
          ref="inputRef"
          v-model="password"
          class="gate__input"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="Password"
          aria-describedby="case-study-password-error"
        />
        <button class="gate__submit" type="submit">
          Unlock
        </button>
      </div>
      <p
        v-if="error"
        id="case-study-password-error"
        class="gate__error"
        role="alert"
      >
        {{ error }}
      </p>
    </form>
  </div>
</template>

<style scoped>
.gate {
  display: flex;
  justify-content: center;
  padding: 4rem var(--page-padding) 6rem;
}

.gate__form {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gate__label {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-text);
}

.gate__row {
  display: flex;
  gap: 8px;
}

.gate__input {
  flex: 1;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background-color: #161616;
  color: var(--color-text);
  font-weight: 400;
  outline: none;
  transition: border-color var(--transition-fast);
}

.gate__input::placeholder {
  color: var(--color-text-muted);
}

.gate__input:focus {
  border-color: color-mix(in srgb, var(--color-text) 40%, var(--color-border));
}

.gate__submit {
  height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 10px;
  background-color: var(--color-surface);
  color: var(--color-text);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    transform 100ms ease-out;
}

.gate__submit:hover {
  background-color: rgb(108, 108, 108);
}

.gate__submit:active {
  transform: scale(0.97);
}

.gate__error {
  font-size: 13px;
  font-weight: 400;
  color: #ff8f8f;
}
</style>
