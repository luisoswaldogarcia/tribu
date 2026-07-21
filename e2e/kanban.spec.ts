import { test, expect } from '@playwright/test'

test.describe('Kanban Board', () => {
  test('board shows four columns in English', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('On Hold')).toBeVisible()
    await expect(page.getByText('Done')).toBeVisible()
  })

  test('can open create task modal', async ({ page }) => {
    await page.goto('/')
    await page.locator('button.fab').last().click()
    await expect(page.getByText('Nueva tarea')).toBeVisible()
    await expect(page.getByPlaceholder('¿Qué hay que hacer?')).toBeVisible()
  })

  test('can create a task', async ({ page }) => {
    await page.goto('/')
    await page.locator('button.fab').last().click()
    await page.fill('input[placeholder="¿Qué hay que hacer?"]', 'E2E test task')
    await page.click('text=Crear tarea')
    await expect(page.getByText('E2E test task')).toBeVisible()
  })

  test('can drag a task to On Hold column', async ({ page }) => {
    await page.goto('/')
    // Get a card from To Do column
    const card = page.locator('.card').filter({ hasText: 'Diseñar base de datos' })
    const holdColumn = page.locator('.column').filter({ hasText: 'On Hold' })

    await card.dragTo(holdColumn)
    // Verify the card is now in the On Hold column
    await expect(holdColumn.locator('.card').filter({ hasText: 'Diseñar base de datos' })).toBeVisible()
  })
})

test.describe('Agent Sidebar', () => {
  test('sidebar is visible with agents', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.agent-sidebar')
    await expect(sidebar).toBeVisible()
    // Default agents: Zeref, PixelBot, Nyx
    await expect(sidebar.getByText('Zeref')).toBeVisible()
    await expect(sidebar.getByText('PixelBot')).toBeVisible()
    await expect(sidebar.getByText('Nyx')).toBeVisible()
  })

  test('sidebar shows footer with agent count', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.agent-sidebar')
    await expect(sidebar.getByText('3 activos / 3 total')).toBeVisible()
  })

  test('sidebar can be collapsed and expanded', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.agent-sidebar')
    const toggle = page.locator('.sidebar-toggle')

    // Initially expanded
    await expect(sidebar).not.toHaveClass(/collapsed/)

    // Collapse
    await toggle.click()
    await expect(sidebar).toHaveClass(/collapsed/)

    // Expand again
    await toggle.click()
    await expect(sidebar).not.toHaveClass(/collapsed/)
  })

  test('clicking an agent highlights their tasks', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.agent-sidebar')

    // Click on Zeref (agent a1, assigned to t1, t4, t6)
    await sidebar.getByText('Zeref').click()

    // Cards assigned to Zeref should be highlighted
    const highlightedCards = page.locator('.card-highlighted')
    await expect(highlightedCards).not.toHaveCount(0)

    // Click again to deselect
    await sidebar.getByText('Zeref').click()
    await expect(page.locator('.card-highlighted')).toHaveCount(0)
  })

  test('status dots are visible for each agent', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('.agent-sidebar')
    const dots = sidebar.locator('.status-dot')
    // 3 default agents = 3 dots
    await expect(dots).toHaveCount(3)
  })
})
