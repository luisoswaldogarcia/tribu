import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentDetailView from '../components/AgentDetailView'
import { AgentProvider } from '../context/AgentContext'
import type { Column } from '../types'

const columns: Column[] = [
  { id: 'wip', title: 'In Progress', tasks: [{ id: 't4', title: 'Implementar login', priority: 'alta', agents: ['a1'] }], color: '#ffd93d' },
]

function renderView(props?: { onClose?: () => void }) {
  const onClose = props?.onClose ?? vi.fn()
  return render(
    <AgentProvider>
      <AgentDetailView onClose={onClose} columns={columns} />
    </AgentProvider>
  )
}

describe('AgentDetailView', () => {
  it('renders header with title', () => {
    renderView()
    expect(screen.getByText('Gestión de agentes')).toBeInTheDocument()
  })

  it('renders all default agents in table', () => {
    renderView()
    expect(screen.getByText('Zeref')).toBeInTheDocument()
    expect(screen.getByText('PixelBot')).toBeInTheDocument()
    expect(screen.getByText('Nyx')).toBeInTheDocument()
  })

  it('shows status labels for each agent', () => {
    renderView()
    const activos = screen.getAllByText('Activo')
    expect(activos.length).toBe(3)
  })

  it('renders mode select with current value', () => {
    renderView()
    const selects = screen.getAllByRole('combobox')
    // 3 agents → 3 mode selects
    expect(selects.length).toBe(3)
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    renderView({ onClose })
    await userEvent.click(screen.getByTitle('Cerrar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has edit button for each agent', () => {
    renderView()
    const editBtns = screen.getAllByTitle('Editar')
    expect(editBtns.length).toBe(3)
  })

  it('has duplicate button for each agent', () => {
    renderView()
    const dupBtns = screen.getAllByTitle('Duplicar')
    expect(dupBtns.length).toBe(3)
  })

  it('has toggle button for each agent', () => {
    renderView()
    const toggleBtns = screen.getAllByTitle('Desactivar')
    expect(toggleBtns.length).toBe(3)
  })

  it('has delete button for each agent', () => {
    renderView()
    const delBtns = screen.getAllByTitle('Eliminar')
    expect(delBtns.length).toBe(3)
  })

  it('opens edit modal when edit button clicked', async () => {
    renderView()
    await userEvent.click(screen.getAllByTitle('Editar')[0])
    expect(screen.getByText('Editar agente')).toBeInTheDocument()
  })

  it('opens create modal when add button clicked', async () => {
    renderView()
    await userEvent.click(screen.getByText('+ Agregar agente'))
    // The CreateAgentModal has a header "Agregar agente" and a submit button
    expect(screen.getByPlaceholderText('Nombre del agente')).toBeInTheDocument()
  })

  it('shows table column headers', () => {
    renderView()
    expect(screen.getByText('Agente')).toBeInTheDocument()
    expect(screen.getByText('Estado')).toBeInTheDocument()
    expect(screen.getByText('Modo')).toBeInTheDocument()
    expect(screen.getByText('Modelo')).toBeInTheDocument()
    expect(screen.getByText('Tarea actual')).toBeInTheDocument()
    expect(screen.getByText('Acciones')).toBeInTheDocument()
  })
})
