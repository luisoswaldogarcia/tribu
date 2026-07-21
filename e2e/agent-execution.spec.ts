import { test, expect } from '@playwright/test'

const modes = [
  { value: 'plan', label: '📐 Plan' },
  { value: 'executor', label: '⚡ Executor' },
  { value: 'advisor', label: '💡 Advisor' },
]

const executors = [
  { value: 'opencode', label: '🔧 OpenCode' },
  { value: 'kiro-cli', label: '🚀 Kiro CLI' },
]

test.describe('Agent Creation — All mode × executor combinations', () => {
  for (const mode of modes) {
    for (const executor of executors) {
      test(`creates a ${mode.value} agent using ${executor.value}`, async ({ page }) => {
        await page.goto('/')

        // Open agent creation modal via FAB
        await page.locator('button.fab-agent').click()
        await expect(page.getByRole('heading', { name: 'Agregar agente' })).toBeVisible()

        // Clear name and type a custom name
        const nameInput = page.getByPlaceholder('Nombre del agente')
        await nameInput.fill(`Test-${mode.value}-${executor.value}`)

        // Select executor
        const executorSelect = page.locator('select').filter({ has: page.getByText(executor.label) }).first()
        await executorSelect.selectOption(executor.value)

        // Select mode
        const modeSelect = page.locator('select').filter({ has: page.getByText(mode.label) }).first()
        await modeSelect.selectOption(mode.value)

        // Submit without profile
        await page.getByRole('button', { name: 'Agregar sin perfil' }).click()

        // Modal should close
        await expect(page.getByRole('heading', { name: 'Agregar agente' })).not.toBeVisible()

        // Agent should appear in sidebar
        const sidebar = page.locator('.agent-sidebar')
        await expect(sidebar.getByText(`Test-${mode.value}-${executor.value}`)).toBeVisible()
      })
    }
  }
})

test.describe('Agent Creation — With description for profile generation', () => {
  test('opencode plan agent with specialization', async ({ page }) => {
    await page.goto('/')
    await page.locator('button.fab-agent').click()

    const nameInput = page.getByPlaceholder('Nombre del agente')
    await nameInput.fill('Architect-OC')

    // Select opencode (default)
    // Select plan mode
    const modeSelect = page.locator('select').filter({ has: page.getByText('⚡ Executor') }).first()
    await modeSelect.selectOption('plan')

    // Type specialization description
    const descInput = page.getByPlaceholder(/Experto en React/)
    await descInput.fill('Arquitecto de sistemas distribuidos, especialista en microservicios y event sourcing')

    // The generate button should be enabled
    const genBtn = page.getByRole('button', { name: /Generar y crear agente/ })
    await expect(genBtn).toBeEnabled()

    // We don't click generate (would need real CLI) — just verify the UI is correct
    // Instead submit without profile
    await page.getByRole('button', { name: 'Agregar sin perfil' }).click()
    await expect(page.locator('.agent-sidebar').getByText('Architect-OC')).toBeVisible()
  })

  test('kiro-cli advisor agent with specialization', async ({ page }) => {
    await page.goto('/')
    await page.locator('button.fab-agent').click()

    const nameInput = page.getByPlaceholder('Nombre del agente')
    await nameInput.fill('Security-Kiro')

    // Select kiro-cli
    const executorSelect = page.locator('select').filter({ has: page.getByText('🔧 OpenCode') }).first()
    await executorSelect.selectOption('kiro-cli')

    // Select advisor
    const modeSelect = page.locator('select').filter({ has: page.getByText('⚡ Executor') }).first()
    await modeSelect.selectOption('advisor')

    // Type specialization
    const descInput = page.getByPlaceholder(/Experto en React/)
    await descInput.fill('Asesor de seguridad, auditor de dependencias y OWASP top 10')

    // Submit without profile
    await page.getByRole('button', { name: 'Agregar sin perfil' }).click()
    await expect(page.locator('.agent-sidebar').getByText('Security-Kiro')).toBeVisible()
  })
})

test.describe('Task Execution — Execute button per agent', () => {
  test('execute button appears on TODO tasks with assigned agent', async ({ page }) => {
    await page.goto('/')

    // The task "Diseñar base de datos" is in TODO and has agents assigned
    const todoColumn = page.locator('.column').filter({ hasText: 'To Do' })
    const card = todoColumn.locator('.card').filter({ hasText: 'Diseñar base de datos' })

    // Execute button should be visible
    const executeBtn = card.locator('.card-execute-btn')
    await expect(executeBtn).toBeVisible()
    await expect(executeBtn).toHaveText('▶')
  })

  test('execute button does NOT appear on tasks without agents', async ({ page }) => {
    await page.goto('/')

    // "Documentar API" has no agents
    const todoColumn = page.locator('.column').filter({ hasText: 'To Do' })
    const card = todoColumn.locator('.card').filter({ hasText: 'Documentar API' })

    const executeBtn = card.locator('.card-execute-btn')
    await expect(executeBtn).not.toBeVisible()
  })

  test('execute button does NOT appear on WIP tasks', async ({ page }) => {
    await page.goto('/')

    // "Implementar login" is in WIP
    const wipColumn = page.locator('.column').filter({ hasText: 'In Progress' })
    const card = wipColumn.locator('.card').filter({ hasText: 'Implementar login' })

    const executeBtn = card.locator('.card-execute-btn')
    await expect(executeBtn).not.toBeVisible()
  })

  test('clicking execute on a task calls executeTask', async ({ page }) => {
    await page.goto('/')

    // Click execute on "Diseñar base de datos" (assigned to a1, a2)
    const todoColumn = page.locator('.column').filter({ hasText: 'To Do' })
    const card = todoColumn.locator('.card').filter({ hasText: 'Diseñar base de datos' })
    const executeBtn = card.locator('.card-execute-btn')

    await executeBtn.click()

    // Since electronAPI is not available in web mode, the task should still
    // attempt to move to WIP (the UI state change happens before the IPC call)
    // In web mode without electronAPI, the task won't actually execute but
    // the UI transition should still happen
    const wipColumn = page.locator('.column').filter({ hasText: 'In Progress' })
    await expect(wipColumn.getByText('Diseñar base de datos')).toBeVisible()
  })

  test('create agent then create task and see execute button', async ({ page }) => {
    await page.goto('/')

    // 1. Create a new opencode executor agent
    await page.locator('button.fab-agent').click()
    const nameInput = page.getByPlaceholder('Nombre del agente')
    await nameInput.fill('TaskRunner')
    await page.getByRole('button', { name: 'Agregar sin perfil' }).click()

    // 2. Create a new task assigned to that agent
    await page.locator('button.fab').last().click()
    await page.fill('input[placeholder="¿Qué hay que hacer?"]', 'Run tests for module X')
    await page.fill('textarea[placeholder="Detalles opcionales..."]', 'Execute npm run test in the project')

    // Select the agent "TaskRunner"
    const agentSelect = page.locator('select').filter({ has: page.getByText('Sin agente asignado') })
    // TaskRunner should be in the dropdown — get all options and find the right one
    const options = agentSelect.locator('option')
    const count = await options.count()
    let taskRunnerValue = ''
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent()
      if (text && text.includes('TaskRunner')) {
        taskRunnerValue = await options.nth(i).getAttribute('value') || ''
        break
      }
    }
    await agentSelect.selectOption(taskRunnerValue)

    await page.click('text=Crear tarea')

    // 3. The new task should have an execute button
    const todoColumn = page.locator('.column').filter({ hasText: 'To Do' })
    const card = todoColumn.locator('.card').filter({ hasText: 'Run tests for module X' })
    await expect(card).toBeVisible()

    const executeBtn = card.locator('.card-execute-btn')
    await expect(executeBtn).toBeVisible()
  })
})
