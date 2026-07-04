/**
 * Returns a Sequelize field `get()` function that safely parses JSON
 * columns. Some mysql2/Sequelize version combinations return JSON columns
 * as raw strings instead of parsed objects; this makes the behavior
 * consistent regardless of driver quirks.
 */
const safeJsonGetter = (fieldName) =>
  function get() {
    const raw = this.getDataValue(fieldName);
    if (raw === null || raw === undefined) return raw;
    if (typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return raw;
    }
  };

module.exports = { safeJsonGetter };
