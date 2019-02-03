(function (dateTimeInput) {
  dateTimeInput.patterns = {
    date: date,
    dateTime: dateTime
  };

  function date() {
    return new dateTimeInput.Pattern([
      dateTimeInput.sections.day(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.month(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.year()
    ]);
  }

  function dateTime() {
    return new dateTimeInput.Pattern([
      dateTimeInput.sections.day(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.month(),
      dateTimeInput.sections.placeholder('/'),
      dateTimeInput.sections.year(),
      dateTimeInput.sections.placeholder(' '),
      dateTimeInput.sections.hour(),
      dateTimeInput.sections.placeholder(':'),
      dateTimeInput.sections.minute()
    ]);
  }
})(dateTimeInput);
