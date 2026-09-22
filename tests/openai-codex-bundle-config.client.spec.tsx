// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { OpenAICodexBundleConfig } from '../src/client/OpenAICodexBundleConfig.tsx'
import { OpenAICodexAccountStore } from '../src/client/account-store.ts'
import { OpenAICodexUpdateStore } from '../src/client/update-store.ts'
import { en } from '../src/client/locales.ts'
import { OPENAI_CODEX_MODEL_CATALOG_PATH } from '../src/model-contract.ts'
import { DEFAULT_OPENAI_CODEX_SETTINGS, resolveOpenAICodexSettings } from '../src/settings-contract.ts'
import type { OpenAICodexSettingsConfig } from '../src/settings-contract.ts'
import { modelCatalogFixture } from './model-catalog-fixture.ts'

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', '') } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open') } },
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
})

it('opens the model selector from the dedicated Plugins bundle page and saves visibility', async () => {
  const catalog = modelCatalogFixture([
    { id: 'gpt-6-sol', name: 'GPT-6-Sol' },
    { id: 'gpt-6-luna', name: 'GPT-6-Luna' },
  ])
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
    const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname : new URL(input.url).pathname
    return new Response(JSON.stringify(path === OPENAI_CODEX_MODEL_CATALOG_PATH ? catalog : { status: 'signed-out', accounts: [] }), {
      status: 200, headers: { 'content-type': 'application/json' },
    })
  }))

  let snapshot: SettingsScopeSnapshot<OpenAICodexSettingsConfig> = {
    status: 'ready', value: DEFAULT_OPENAI_CODEX_SETTINGS, base: DEFAULT_OPENAI_CODEX_SETTINGS,
    user: undefined, revision: 0, writable: true, mode: 'host',
  }
  const listeners = new Set<() => void>()
  const mutate = vi.fn<SettingsScope<OpenAICodexSettingsConfig>['mutate']>(async (ops, revision) => {
    expect(revision).toBe(snapshot.revision)
    const next = { ...snapshot.value! }
    for (const op of ops) Object.assign(next, { [op.path[0]!]: op.op === 'set' ? op.value : undefined })
    snapshot = { ...snapshot, value: resolveOpenAICodexSettings(next), revision: (revision ?? 0) + 1 }
    for (const listener of listeners) listener()
  })
  const configScope: SettingsScope<OpenAICodexSettingsConfig> = {
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    mutate,
    set: vi.fn(async () => undefined),
    unset: vi.fn(async () => undefined),
  }
  const account = new OpenAICodexAccountStore()
  const updater = new OpenAICodexUpdateStore('0.1.0-alpha.4.39')
  const t = (key: keyof typeof en) => en[key]
  const injected = { t, account, configScope, updater } as const

  const summary = render(<OpenAICodexBundleConfig view="summary" {...injected} />)
  expect(summary.container.textContent).toBe(en.intro)
  summary.unmount()

  render(<OpenAICodexBundleConfig view="page" {...injected} />)
  expect(screen.getByText(en.updateHeading)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: en.moreSettings }))
  const dialog = await screen.findByRole('dialog', { name: en.moreSettingsTitle })
  expect(dialog.hasAttribute('open')).toBe(true)
  const sol = await screen.findByRole('checkbox', { name: /GPT-6-Sol/u })
  const luna = screen.getByRole('checkbox', { name: /GPT-6-Luna/u })
  expect(sol).toHaveProperty('checked', true)
  expect(luna).toHaveProperty('checked', true)
  fireEvent.click(luna)
  fireEvent.click(screen.getByRole('button', { name: en.save }))
  await waitFor(() => expect(snapshot.value?.models).toEqual(['gpt-6-sol']))
  expect(mutate).toHaveBeenCalledWith([{ op: 'set', path: ['models'], value: ['gpt-6-sol'] }], 0)
  account.dispose()
  updater.dispose()
})
