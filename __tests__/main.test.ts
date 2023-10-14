import * as core from '@actions/core'
import * as main from '../src/main'
import * as actor from '../src/action'
import * as fetch from '../src/limitFetcher'
import * as processor from '../src/processThreshold'
import * as validator from '../src/validateResource'

// Mock the GitHub Actions core library
const infoMock = jest.spyOn(core, 'info')
const getInputMock = jest.spyOn(core, 'getInput')
const setFailedMock = jest.spyOn(core, 'setFailed')

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the act function (tested separately)
jest.spyOn(actor, 'act').mockImplementation(jest.fn())

// Mock the act function (tested separately)
jest.spyOn(processor, 'processThreshold')

// Mock the act function (tested separately)
jest.spyOn(validator, 'validateResource')

// Mock the fetchRateLimit function to return specific values
const fetchRateLimitMock = jest.fn().mockResolvedValue({
  limit: 5000,
  remaining: 2600,
  reset: 1696896000
})

jest.spyOn(fetch, 'fetchRateLimit').mockImplementation(fetchRateLimitMock)

describe('main.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should run with valid input, but do nothing with plentiful API quota', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'sweep'
        case 'threshold':
          return '20%'
        case 'alarm':
          return '5'
        case 'delay':
          return '3'
        case 'resource':
          return 'core'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(processor.processThreshold).toHaveBeenCalledWith('20%')
    expect(validator.validateResource).toHaveBeenCalledWith('core')

    expect(fetchRateLimitMock).toHaveBeenCalledWith('some_token', 'core')
    expect(actor.act).not.toHaveBeenCalled()
    expect(infoMock).toHaveBeenCalledWith(
      'The API quota is plentiful: 2600 of 5000 requests on core remain.'
    )
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('should run with valid input, and act on low API quota', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'sleep'
        case 'threshold':
          return '90%'
        case 'alarm':
          return '5'
        case 'delay':
          return '3'
        case 'resource':
          return 'graphql'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(fetchRateLimitMock).toHaveBeenCalledWith('some_token', 'graphql')
    expect(actor.act).toHaveBeenCalledWith(
      'sleep',
      5000,
      1696896000,
      5,
      3,
      'graphql'
    )
    expect(infoMock).toHaveBeenCalledWith(
      'The API quota is below the threshold: 2600 of 5000 requests on graphql remain.'
    )
    expect(setFailedMock).not.toHaveBeenCalled()
  })

  it('should fail with invalid alarm input and sleep action', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'sleep'
        case 'threshold':
          return '20%'
        case 'alarm':
          return '0'
        case 'delay':
          return '3'
        case 'resource':
          return 'core'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    // Execute the main function
    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'Alarm must be a positive number'
    )
    expect(actor.act).not.toHaveBeenCalledWith()
    expect(runMock).toHaveReturned()
  })

  it('should ignore invalid alarm input with other action than sleep', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'peep'
        case 'threshold':
          return '20%'
        case 'alarm':
          return '0'
        case 'delay':
          return '3'
        case 'resource':
          return 'core'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    // Execute the main function
    await main.run()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(runMock).toHaveReturned()
  })

  it('should fail with invalid delay input and sleep action', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'sleep'
        case 'threshold':
          return '20%'
        case 'alarm':
          return '60'
        case 'delay':
          return '-1'
        case 'resource':
          return 'core'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    // Execute the main function
    await main.run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'Delay must be a positive number'
    )
    expect(runMock).toHaveReturned()
  })

  it('should ignore invalid delay input when called with other action than sleep', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'actionToTake':
          return 'sweep'
        case 'threshold':
          return '20%'
        case 'alarm':
          return '60'
        case 'delay':
          return '-1'
        case 'resource':
          return 'core'
        case 'token':
          return 'some_token'
        default:
          return ''
      }
    })

    // Execute the main function
    await main.run()

    expect(setFailedMock).not.toHaveBeenCalled()
    expect(runMock).toHaveReturned()
  })
})
