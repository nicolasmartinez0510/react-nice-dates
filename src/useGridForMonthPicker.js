import { useRef, useLayoutEffect, useEffect, useReducer } from 'react'

import {
  addYears,
  differenceInCalendarMonths,
  endOfYear,
  isAfter,
  isBefore,
  isSameMonth,
  startOfYear,
  subYears
} from 'date-fns'

import { ORIGIN_BOTTOM, ORIGIN_TOP } from './constants'

const rowsBetweenDates = (startDate, endDate, locale) => differenceInCalendarMonths(endDate, startDate, { locale })
const getStartDate = (date, locale) => startOfYear(date, { locale })
const getEndDate = (date, locale) => endOfYear(date, { locale })

const createInitialState = (currentDate, locale) => {
  return {
    startDate: getStartDate(currentDate, locale),
    endDate: getEndDate(currentDate, locale),
    cellHeight: 0,
    isWide: false,
    lastCurrentMonth: currentDate,
    locale,
    offset: 0,
    origin: ORIGIN_TOP,
    transition: false
  }
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'setStartDate':
      return { ...state, startDate: action.value }
    case 'setEndDate':
      return { ...state, endDate: action.value }
    case 'setRange':
      return { ...state, startDate: action.startDate, endDate: action.endDate }
    case 'setCellHeight':
      return { ...state, cellHeight: action.value }
    case 'setIsWide':
      return { ...state, isWide: action.value }
    case 'reset':
      return {
        ...createInitialState(action.currentMonth, state.locale),
        cellHeight: state.cellHeight,
        isWide: state.isWide
      }
    case 'transitionToCurrentMonth': {
      const { currentMonth } = action
      const { lastCurrentMonth, cellHeight } = state

      const newState = {
        ...state,
        lastCurrentMonth: currentMonth,
        transition: true
      }

      if (isAfter(currentMonth, lastCurrentMonth)) {
        const offset = -4 * cellHeight

        return {
          ...newState,
          endDate: getEndDate(currentMonth, state.locale),
          offset,
          origin: ORIGIN_TOP
        }
      } else if (isBefore(currentMonth, lastCurrentMonth)) {
        const gridHeight = cellHeight * 4
        const offset = (8 * cellHeight) - gridHeight

        return {
          ...newState,
          startDate: getStartDate(currentMonth, state.locale),
          offset,
          origin: ORIGIN_BOTTOM
        }
      }

      return state
    }
    default:
      throw new Error(`Unknown ${action.type} action type`)
  }
}

export default function useGrid({ locale, date: currentDate, onMonthChange, transitionDuration, touchDragEnabled }) {
  const timeoutRef = useRef()
  const containerElementRef = useRef()
  const initialDragPositionRef = useRef(0)
  const [state, dispatch] = useReducer(reducer, createInitialState(currentDate, locale))
  const { startDate, endDate, cellHeight, lastCurrentMonth, offset, origin, transition, isWide } = state

  useLayoutEffect(() => {
    const notDragging = !initialDragPositionRef.current

    if (!isSameMonth(lastCurrentMonth, currentDate) && notDragging) {
      const containerElement = containerElementRef.current
      containerElement.classList.add('-transition')
      clearTimeout(timeoutRef.current)

      dispatch({ type: 'transitionToCurrentMonth', currentMonth: currentDate })

      timeoutRef.current = setTimeout(() => {
        dispatch({ type: 'reset', currentMonth: currentDate })
      }, transitionDuration)
    }
  }, [currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!touchDragEnabled) {
      return
    }

    const containerElement = containerElementRef.current

    if (containerElement) {
      const handleDragStart = event => {
        clearTimeout(timeoutRef.current)
        const computedOffset = Number(window.getComputedStyle(containerElement).transform.match(/([-+]?[\d.]+)/g)[5])
        const currentMonthPosition = 0

        containerElement.style.transform = `translate3d(0, ${computedOffset || -currentMonthPosition}px, 0)`
        containerElement.classList.remove('-transition')
        containerElement.classList.add('-moving')
        initialDragPositionRef.current = event.touches[0].clientY + (-computedOffset || currentMonthPosition)
      }

      const handleDrag = event => {
        const initialDragPosition = initialDragPositionRef.current
        const dragOffset = event.touches[0].clientY - initialDragPosition
        const previousYear = subYears(currentDate, 1)
        const nextYear = addYears(currentDate, 1)

        dispatch({ type: 'setEndDate', value: getEndDate(nextYear, locale) })
        const newStartDate = getStartDate(previousYear, locale)
        dispatch({ type: 'setStartDate', value: newStartDate })

        containerElement.style.transform = `translate3d(0, ${dragOffset}px, 0)`
        event.preventDefault()
      }

      const handleDragEnd = event => {
        const currentMonthPosition = (rowsBetweenDates(startDate, currentDate, locale) - 1) * cellHeight
        containerElement.style.transform = `translate3d(0, ${-currentMonthPosition}px, 0)`
        containerElement.classList.add('-transition')
        containerElement.classList.remove('-moving')

        timeoutRef.current = setTimeout(() => {
          initialDragPositionRef.current = 0
          containerElement.style.transform = 'translate3d(0, 0, 0)'
          containerElement.classList.remove('-transition')
          dispatch({ type: 'reset', currentMonth: currentDate })
        }, transitionDuration)

        if (Math.abs(initialDragPositionRef.current - currentMonthPosition - event.changedTouches[0].clientY) > 10) {
          event.preventDefault()
          event.stopPropagation()
        }
      }

      containerElement.addEventListener('touchstart', handleDragStart)
      containerElement.addEventListener('touchmove', handleDrag)
      containerElement.addEventListener('touchend', handleDragEnd)

      return () => {
        containerElement.removeEventListener('touchstart', handleDragStart)
        containerElement.removeEventListener('touchmove', handleDrag)
        containerElement.removeEventListener('touchend', handleDragEnd)
      }
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const containerElement = containerElementRef.current
      const containerWidth = containerElement.offsetWidth
      const cellWidth = containerWidth / 7
      let newCellHeight = 1
      let wide = false

      if (cellWidth > 60) {
        newCellHeight += Math.round(cellWidth * 0.75)
        wide = true
      } else {
        newCellHeight += Math.round(cellWidth)
      }

      dispatch({ type: 'setIsWide', value: wide })
      dispatch({ type: 'setCellHeight', value: newCellHeight })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    startDate,
    endDate,
    cellHeight,
    containerElementRef,
    offset,
    origin,
    transition,
    isWide
  }
}
