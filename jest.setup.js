import '@testing-library/jest-dom'

// Only set up DOM mocks in jsdom environment
if (typeof window !== 'undefined') {
  // Mock scrollIntoView for all tests
  global.Element.prototype.scrollIntoView = jest.fn()
}