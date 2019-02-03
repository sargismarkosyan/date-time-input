(function (dateTimeInput) {
  var bootstrapDatepickerDefaultOptions = {
    hoursSelectBehaviour: undefined,
    minViewMode: null,
    startDate: null,
    language: 'en',
    endDate: null,
    onShow: _.noop,
    onHide: _.noop,
    onStayInField: _.noop
  };

  var hourSection = dateTimeInput.sections.hour();
  var minuteSection = dateTimeInput.sections.minute();

  dateTimeInput.calendars = {
    bootstrapDatepicker: bootstrapDatepicker
  };

  function bootstrapDatepicker(element, fieldModel, options) {
    if (!$.fn.datepicker) {
      throw 'To install datepicker install it first. https://github.com/uxsolutions/bootstrap-datepicker';
    }

    var $element = $(element);
    var shouldShowOnFocus = true;
    var indexOfPatternHoursSection = _.findIndex(fieldModel.pattern.sections, {format: hourSection.format});
    var indexOfPatternMinutesSection = _.findIndex(fieldModel.pattern.sections, {format: minuteSection.format});

    var calendar = new dateTimeInput.Calendar($element.get(0), options, bootstrapDatepickerDefaultOptions);

    calendar.show = function () {
      setupDatepicker(calendar.options);
      $element.datepicker('show');
    };

    calendar.hide = function () {
      $element.datepicker('hide');
      destroyDatepicker(calendar.options);
    };

    calendar.destroy = function () {
      destroyDatepicker(calendar.options);
    };

    calendar.shouldShow = function () {
      var oldValue = shouldShowOnFocus;
      shouldShowOnFocus = true;
      return oldValue;
    };

    calendar.shouldHide = function () {
      var $datepicker = $('.datepicker');
      if (!$datepicker.length) {
        return true;
      }

      return !$datepicker.is(':hover');
    };

    calendar.isCompleted = function () {
      return !!fieldModel.pattern.stringToDate(calendar.element.value);
    };

    calendar.onOptionsChange = function (changedOptions) {
      var datepicker = $element.data('datepicker');
      if (!datepicker) {
        return;
      }

      if ('startDate' in changedOptions) {
        datepicker.setStartDate(_.get(changedOptions, 'startDate', null));
      }

      if ('endDate' in changedOptions) {
        datepicker.setEndDate(_.get(changedOptions, 'endDate', null));
      }
    };

    return calendar;

    function setupDatepicker(options) {
      $element.datepicker({
          format: {
            toDisplay: function (date, otherFormat, language) {
              date = moment(date).add(-moment(date).utcOffset(), 'minutes').toDate();
              var dateFromValue = stringToDate($element.val());
              if (date && dateFromValue) {
                date.setHours(dateFromValue.getHours());
                date.setMinutes(dateFromValue.getMinutes());
                date.setSeconds(dateFromValue.getSeconds());
                date.setMilliseconds(dateFromValue.getMilliseconds());
              }

              var fieldValue = applyHoursSelectBehaviour(date, fieldModel.oldValue, calendar.options);
              fieldModel.oldValue = fieldValue;
              calendar.hide();
              return fieldValue;
            },
            toValue: function (value, otherFormat, language) {
              var date = stringToDate(value);
              if (date) {
                date = dateToUTC(date);
              }
              return date;
            }
          },
          keyboardNavigation: false,
          language: options.language,
          forceParse: false,
          maxViewMode: 2,
          minViewMode: options.minViewMode || null,
          startDate: options.startDate || null,
          endDate: options.endDate || null
        })
        .on('show', options.onShow)
        .on('hide', options.onHide);
    }

    function destroyDatepicker(options) {
      $element.datepicker('destroy').off('show', options.onShow).off('hide', options.onHide);
    }

    function applyHoursSelectBehaviour(date, oldValue, options) {
      var mValidDate = moment(date);
      switch (options.hoursSelectBehaviour) {
        case dateTimeInput.Calendar.onDateSelectHoursAction.unchanged:
          if (indexOfPatternHoursSection === -1 || indexOfPatternMinutesSection === -1) {
            return fieldModel.pattern.dateToString(mValidDate.toDate());
          }

          var newValue = fieldModel.pattern.dateToString(mValidDate.toDate());
          var newSectionValues = fieldModel.pattern.getSectionValues(newValue);
          var oldSectionValues = fieldModel.pattern.getSectionValues(oldValue);
          _.set(newSectionValues, indexOfPatternHoursSection, _.get(oldSectionValues, indexOfPatternHoursSection));
          _.set(newSectionValues, indexOfPatternMinutesSection, _.get(oldSectionValues, indexOfPatternMinutesSection));
          var emptySection = _.find(fieldModel.pattern.sections, function (section, index) {
            return section.selectable && section.getPlaceholder() === _.get(newSectionValues, index);
          });

          if (emptySection) {
            options.onStayInField();
            setTimeout(function () {
              shouldShowOnFocus = false;
              calendar.element.focus();
              fieldModel.setSelectedSection(emptySection);
            });
          }

          return newSectionValues.join('');

        case dateTimeInput.Calendar.onDateSelectHoursAction.end:
          mValidDate = mValidDate.endOf('day');
          return fieldModel.pattern.dateToString(mValidDate.toDate());

        default: //start case
          mValidDate = mValidDate.startOf('day');
          return fieldModel.pattern.dateToString(mValidDate.toDate());
      }
    }

    function stringToDate(value) {
      var date = fieldModel.pattern.stringToDate(value);
      if (!date) {
        date = dateTimeInput.util.date.stringToDate(value, false);
      }

      return date;
    }

    function dateToUTC(date) {
      return moment(date).add(moment(date).utcOffset(), 'minutes').toDate();
    }
  }
})(dateTimeInput);
