import { useState, useEffect, useRef, Dispatch } from 'react'
import nanoid from 'nanoid'

export type APIPollingOptions<DataType> = {
  fetchFunc: () => Promise<DataType>
  initialState: DataType
  delay: number
  onError?: (e: Error, setData?: Dispatch<any>) => void
  updateTrigger?: any
}

function useAPIPolling<DataType>(opts: APIPollingOptions<DataType>): DataType {
  const { initialState, fetchFunc, delay, onError, updateTrigger } = opts

  const timerId = useRef<any>()
  const fetchCallId = useRef<any>()
  const [data, setData] = useState(initialState)

  const fetchData = (id: string) => {
    return new Promise(resolve => {
      fetchFunc()
        .then(newData => {
          if (id === fetchCallId.current) {
            setData(newData)
          }

          resolve()
        })
        .catch(e => {
          if (!onError) {
            setData(initialState)
            resolve()
          } else {
            onError(e, setData)
            resolve()
          }
        })
    })
  }

  const pollingRoutine = () => {
    fetchCallId.current = nanoid()
    /* tslint:disable no-floating-promises */
    fetchData(fetchCallId.current).then(() => {
      doPolling()
    })
    /* tslint:enable no-floating-promises */
  }

  const doPolling = () => {
    timerId.current = setTimeout(() => {
      pollingRoutine()
    }, delay)
  }

  const stopPolling = () => {
    if (timerId.current) {
      clearTimeout(timerId.current)
      timerId.current = null
    }
  }

  useEffect(
    () => {
      /* tslint:disable no-floating-promises */
      pollingRoutine()
      /* tslint:enable */

      return stopPolling
    },
    updateTrigger ? [updateTrigger] : []
  )

  return data
}

export default useAPIPolling
