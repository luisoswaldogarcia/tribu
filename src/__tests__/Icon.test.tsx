import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Icon from '../components/Icon'

describe('Icon component', () => {
  it('renders a static icon by name', () => {
    const { container } = render(<Icon name="edit" size={16} />)
    // PxlKitIcon renders an img with SVG data URI
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })

  it('renders with title attribute', () => {
    render(<Icon name="delete" size={16} title="Eliminar" />)
    expect(screen.getByTitle('Eliminar')).toBeInTheDocument()
  })

  it('renders animated icon with flame', () => {
    const { container } = render(<Icon name="flame" size={16} animated />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })

  it('renders with custom className', () => {
    const { container } = render(<Icon name="play" size={20} className="my-icon" />)
    const wrapper = container.querySelector('.my-icon')
    expect(wrapper).not.toBeNull()
  })

  it('returns null for unknown icon name', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { container } = render(<Icon name="nonexistent" />)
    expect(container.innerHTML).toBe('')
    spy.mockRestore()
  })

  it('applies tinted appearance when color is provided', () => {
    const { container } = render(<Icon name="check-circle" size={24} color="#6bcb77" />)
    const img = container.querySelector('img')
    expect(img).not.toBeNull()
  })
})
