import React from 'react'
import { bool, func, instanceOf, object } from 'prop-types'
import classNames from 'classnames'
import { startOfMonth, format, isSameMonth, addYears, subYears, subMonths, addMonths } from 'date-fns'

export default function CalendarNavigation({ locale, month, minimumDate, maximumDate, onMonthChange, showMonthPicker, show }) {
  const handlePrevious = event => {
    show
      ? onMonthChange(startOfMonth(subMonths(month, 1)))
      : onMonthChange(subYears(month, 1))
    event.preventDefault()
  }

  const handleNext = event => {
    show
      ? onMonthChange(startOfMonth(addMonths(month, 1)))
      : onMonthChange(addYears(month, 1))
    event.preventDefault()
  }

  return (
    <div className='nice-dates-navigation'>
      <a
        className={classNames('nice-dates-navigation_previous', {
          '-disabled': isSameMonth(month, minimumDate)
        })}
        onClick={handlePrevious}
        onTouchEnd={handlePrevious}
      />

      <span className='nice-dates-navigation_current' onClick={ showMonthPicker }>
        {show
          ? format(month, 'LLLL yyyy', { locale })
          : format(month, 'yyyy', { locale })
        }
      </span>

      <a
        className={classNames('nice-dates-navigation_next', {
          '-disabled': isSameMonth(month, maximumDate)
        })}
        onClick={handleNext}
        onTouchEnd={handleNext}
      />
    </div>
  )
}

CalendarNavigation.propTypes = {
  locale: object.isRequired,
  month: instanceOf(Date).isRequired,
  minimumDate: instanceOf(Date),
  maximumDate: instanceOf(Date),
  onMonthChange: func.isRequired,
  showMonthPicker: func,
  show: bool
}
