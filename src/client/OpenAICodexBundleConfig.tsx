/** Codex Connect configuration on Harness's dedicated Plugins page. */

import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { OpenAICodexModelsCard } from './OpenAICodexModelsCard.tsx'
import type { OpenAICodexModelsCardInjected } from './OpenAICodexModelsCard.tsx'
import { OpenAICodexUpdateSettings } from './OpenAICodexUpdateNotice.tsx'
import type { OpenAICodexUpdateStore } from './update-store.ts'

export type OpenAICodexBundleConfigInjected = OpenAICodexModelsCardInjected & { updater: OpenAICodexUpdateStore }

export function OpenAICodexBundleConfig({ view, t, account, configScope, updater }:
  Pick<PropsRuntime<'plugins.bundle.config'>, 'view'> & OpenAICodexBundleConfigInjected) {
  if (view === 'summary') return <>{t('intro')}</>
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
    <OpenAICodexUpdateSettings t={t} updater={updater} />
    <OpenAICodexModelsCard t={t} account={account}
      {...configScope === undefined ? {} : { configScope }} />
  </div>
}
