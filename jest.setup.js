import '@testing-library/jest-dom'

// Mock scrollIntoView for all tests
global.Element.prototype.scrollIntoView = jest.fn()