const parser = require('cron-parser');
const { Op } = require('sequelize');
const { Job, ScheduledJob } = require('../../backend/src/models');

/**
 * Promotes delayed/scheduled Job rows whose run_at has arrived into the
 * "queued" state so the polling loop can pick them up.
 */
const promoteDueJobs = async () => {
  const [count] = await Job.update(
    { status: 'queued' },
    {
      where: {
        status: 'scheduled',
        run_at: { [Op.lte]: new Date() }
      }
    }
  );
  return count;
};

/**
 * Materializes a fresh Job row from each due ScheduledJob (recurring)
 * template, then advances its next_run_at using the cron expression.
 */
const materializeRecurringJobs = async () => {
  const due = await ScheduledJob.findAll({
    where: {
      is_active: true,
      next_run_at: { [Op.lte]: new Date() }
    }
  });

  for (const template of due) {
    await Job.create({
      queue_id: template.queue_id,
      type: template.type,
      payload: template.payload || {},
      job_kind: 'recurring',
      status: 'queued',
      run_at: new Date(),
      cron_expression: template.cron_expression,
      max_attempts: 3
    });

    if (template.cron_expression) {
      try {
        const interval = parser.parseExpression(template.cron_expression);
        await template.update({ next_run_at: interval.next().toDate() });
      } catch (err) {
        console.error(`[scheduler] invalid cron on ScheduledJob ${template.id}:`, err.message);
        await template.update({ is_active: false });
      }
    } else {
      await template.update({ is_active: false });
    }
  }

  return due.length;
};

const runSchedulerSweep = async () => {
  const promoted = await promoteDueJobs();
  const materialized = await materializeRecurringJobs();
  if (promoted || materialized) {
    console.log(`[scheduler] promoted=${promoted} materialized=${materialized}`);
  }
};

module.exports = { runSchedulerSweep };
