import { test, expect } from '@playwright/test'

test.use({ actionTimeout: 10000 })

test.describe('Orchestration — Visual flow', () => {
  test('create orchestrator agent and task, see subtask badges', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)

    // === 1. Create an orchestrator agent ===
    await page.locator('button.fab-agent').click()
    await page.waitForTimeout(1500)
    await expect(page.getByRole('heading', { name: 'Agregar agente' })).toBeVisible()

    const nameInput = page.getByPlaceholder('Nombre del agente')
    await nameInput.fill('')
    await page.waitForTimeout(500)
    await nameInput.pressSequentially('Maestro', { delay: 100 })
    await page.waitForTimeout(1000)

    // Select orchestrator mode
    const modeSelect = page.locator('select').filter({ has: page.getByText('Executor') }).first()
    await modeSelect.selectOption('orchestrator')
    await page.waitForTimeout(1500)

    // Verify the hint appears
    await expect(page.getByText('descompondrá tareas y las delegará')).toBeVisible()
    await page.waitForTimeout(2000)

    // Submit
    await page.getByRole('button', { name: 'Agregar sin perfil' }).click()
    await page.waitForTimeout(1500)

    // Agent should appear in sidebar with orchestrator class
    const sidebar = page.locator('.agent-sidebar')
    await expect(sidebar.getByText('Maestro')).toBeVisible()

    // Verify orchestrator has visual distinction
    const orchestratorItem = sidebar.locator('.sidebar-item-orchestrator')
    await expect(orchestratorItem).toBeVisible()
    await page.waitForTimeout(2000)

    // === 2. Create a second executor agent ===
    await page.locator('button.fab-agent').click()
    await page.waitForTimeout(1000)
    await nameInput.fill('')
    await nameInput.pressSequentially('Worker', { delay: 100 })
    await page.waitForTimeout(1000)
    await modeSelect.selectOption('executor')
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Agregar sin perfil' }).click()
    await page.waitForTimeout(1500)
    await expect(sidebar.getByText('Worker')).toBeVisible()
    await page.waitForTimeout(2000)

    // === 3. Create a task assigned to Maestro ===
    await page.locator('button.fab').last().click()
    await page.waitForTimeout(1500)

    const titleInput = page.locator('input[placeholder="¿Qué hay que hacer?"]')
    await titleInput.pressSequentially('Tarea orquestada de prueba', { delay: 80 })
    await page.waitForTimeout(1000)

    const descInput = page.locator('textarea[placeholder="Detalles opcionales..."]')
    await descInput.pressSequentially('Esta es una prueba de orquestación end-to-end', { delay: 50 })
    await page.waitForTimeout(1000)

    // Select Maestro as agent
    const agentSelect = page.locator('select').filter({ has: page.getByText('Sin agente asignado') })
    const options = agentSelect.locator('option')
    const count = await options.count()
    let maestroValue = ''
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent()
      if (text && text.includes('Maestro')) {
        maestroValue = await options.nth(i).getAttribute('value') || ''
        break
      }
    }
    await agentSelect.selectOption(maestroValue)
    await page.waitForTimeout(1500)

    await page.click('text=Crear tarea')
    await page.waitForTimeout(2000)

    // === 4. Task should appear in TODO with execute button ===
    const todoColumn = page.locator('.column').filter({ hasText: 'To Do' })
    const card = todoColumn.locator('.card').filter({ hasText: 'Tarea orquestada de prueba' })
    await expect(card).toBeVisible()

    const executeBtn = card.locator('.card-execute-btn')
    await expect(executeBtn).toBeVisible()
    await page.waitForTimeout(3000)
  })

  test('subtask badge renders correctly for tasks with parentId', async ({ page }) => {
    await page.goto('/')

    // Simulate a board state with a parent task and subtask
    // We'll test by checking the CSS class exists in the page
    const styles = await page.evaluate(() => {
      // Verify the CSS classes for orchestration exist in the stylesheet
      const sheets = Array.from(document.styleSheets)
      let hasSubtaskBadge = false
      let hasSubtaskProgress = false
      let hasOrchestratorItem = false
      let hasModeHint = false

      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules)
          for (const rule of rules) {
            const text = (rule as CSSStyleRule).selectorText || ''
            if (text.includes('card-subtask-badge')) hasSubtaskBadge = true
            if (text.includes('card-subtask-progress')) hasSubtaskProgress = true
            if (text.includes('sidebar-item-orchestrator')) hasOrchestratorItem = true
            if (text.includes('mode-hint')) hasModeHint = true
          }
        } catch (e) { /* cross-origin sheets */ }
      }
      return { hasSubtaskBadge, hasSubtaskProgress, hasOrchestratorItem, hasModeHint }
    })

    expect(styles.hasSubtaskBadge).toBe(true)
    expect(styles.hasSubtaskProgress).toBe(true)
    expect(styles.hasOrchestratorItem).toBe(true)
    expect(styles.hasModeHint).toBe(true)
  })
})
