import { test, expect } from '@playwright/test'

test('board shows three columns', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Por hacer')).toBeVisible()
  await expect(page.getByText('En progreso')).toBeVisible()
  await expect(page.getByText('Terminado')).toBeVisible()
})

test('can open create task modal', async ({ page }) => {
  await page.goto('/')
  await page.click('button.fab')
  await expect(page.getByText('Nueva tarea')).toBeVisible()
  await expect(page.getByPlaceholder('¿Qué hay que hacer?')).toBeVisible()
})

test('can create a task', async ({ page }) => {
  await page.goto('/')
  await page.click('button.fab')
  await page.fill('input[placeholder="¿Qué hay que hacer?"]', 'E2E test task')
  await page.click('text=Crear tarea')
  await expect(page.getByText('E2E test task')).toBeVisible()
})
