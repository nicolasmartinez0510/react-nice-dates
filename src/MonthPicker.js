import React, { useEffect, useState } from 'react'
import { bool, instanceOf, func, number, object, objectOf, string } from 'prop-types'
import { lightFormat, eachMonthOfInterval } from 'date-fns'
import CalendarMonth from './CalendarMonth'
import classNames from 'classnames'
import { ORIGIN_BOTTOM, ORIGIN_TOP } from './constants'
import useGrid from './useGridForMonthPicker'

const computeModifiers = (modifiers, date) => {
  const computedModifiers = {}

  Object.keys(modifiers).map(key => {
    computedModifiers[key] = modifiers[key](date)
  })

  return computedModifiers
}

export default function MonthPicker({
  locale,
  modifiers,
  actualDate,
  modifiersClassNames,
  onDayHover,
  onClick,
  transitionDuration,
  touchDragEnabled,
  showGrid
}) {
  const grid = useGrid({ locale, date: actualDate, onMonthChange: onClick, transitionDuration, touchDragEnabled })
  const { startDate, endDate, cellHeight, offset, containerElementRef, isWide, origin, transition } = grid
  const [months, setMonths] = useState([])

  useEffect(() => {
    const allMonths = eachMonthOfInterval({
      start: startDate,
      end: endDate
    }).map(date => {
      return (
        <CalendarMonth
          date={date}
          actualDate={actualDate}
          height={cellHeight}
          key={lightFormat(date, 'yyyy-MM-dd')}
          locale={locale}
          modifiers={{
            ...computeModifiers(modifiers, date),
            wide: isWide
          }}
          modifiersClassNames={modifiersClassNames}
          onHover={onDayHover}
          onClick={onClick}
          showGrid={showGrid}
        />
      )
    })

    setMonths(allMonths)
  }, [actualDate, cellHeight, locale, modifiers, modifiersClassNames, onClick, onDayHover, showGrid, isWide, startDate, endDate])

  return (
    <>
      <div className='nice-dates-grid' style={{ height: cellHeight * 4 }}>
        <div
          className={classNames('nice-dates-grid_container', {
            '-moving': offset,
            '-origin-bottom': origin === ORIGIN_BOTTOM,
            '-origin-top': origin === ORIGIN_TOP,
            '-transition': transition
          })}
          ref={containerElementRef}
          style={{
            transform: `translate3d(0, ${offset}px, 0)`,
            transitionDuration: `${transitionDuration}ms`
          }}
        >
          {months}
        </div>
      </div>
    </>
  )
}

MonthPicker.propTypes = {
  locale: object.isRequired,
  actualDate: instanceOf(Date).isRequired,
  modifiers: objectOf(func),
  modifiersClassNames: objectOf(string),
  onDayHover: func,
  transitionDuration: number.isRequired,
  touchDragEnabled: bool,
  onClick: func,
  showGrid: func
}

MonthPicker.defaultProps = {
  modifiers: {},
  transitionDuration: 800,
  touchDragEnabled: true
}
