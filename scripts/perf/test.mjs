import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:4300'
let server
async function run(args) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env: { ...process.env, AUDIT_URL: base } })
  const status = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve) })
  if (status !== 0) throw new Error(`${args.join(' ')} failed (${status})`)
}
try {
  await run(['--test', 'tests/video-coordinator.test.mjs'])
  if (!process.env.AUDIT_URL) {
    server = spawn(process.execPath, ['.output/server/index.mjs'], { stdio: 'inherit', env: { ...process.env, PORT: '4300', HOST: '127.0.0.1' } })
    let ready = false
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error('Production server exited; run npm run build first')
      ready = await fetch(base).then(r => r.ok).catch(() => false)
      if (ready) break
      await delay(100)
    }
    if (!ready) throw new Error('Production server did not start')
  }
  for (const script of ['verify-case-loading', 'verify-coordinator', 'verify-cancellation', 'verify', 'verify-homepage-media']) {
    await run([`scripts/perf/${script}.mjs`])
  }
} finally { server?.kill('SIGTERM') }
