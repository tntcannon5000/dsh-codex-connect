/** Codex Connect configuration on Harness's dedicated Plugins page. */

import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import { OpenAICodexModelsCard } from './OpenAICodexModelsCard.tsx'
import type { OpenAICodexModelsCardInjected } from './OpenAICodexModelsCard.tsx'

export type OpenAICodexBundleConfigInjected = OpenAICodexModelsCardInjected

export function OpenAICodexBundleConfig({ view, t, account, configScope }:
  Pick<PropsRuntime<'plugins.bundle.config'>, 'view'> & OpenAICodexBundleConfigInjected) {
  if (view === 'summary') return <>{t('intro')}</>
  return <OpenAICodexModelsCard t={t} account={account}
    {...configScope === undefined ? {} : { configScope }} />
}
