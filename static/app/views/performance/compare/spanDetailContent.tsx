import {Fragment} from 'react';
import map from 'lodash/map';

import DateTime from 'sentry/components/dateTime';
import {
  Row,
  SpanDetails,
  Tags,
} from 'sentry/components/events/interfaces/spans/spanDetail';
import {rawSpanKeys, SpanType} from 'sentry/components/events/interfaces/spans/types';
import {t} from 'sentry/locale';
import getDynamicText from 'sentry/utils/getDynamicText';

type Props = {
  span: Readonly<SpanType>;
};

const SpanDetailContent = (props: Props) => {
  const {span} = props;

  const startTimestamp: number = span.start_timestamp;
  const endTimestamp: number = span.timestamp;

  const duration = (endTimestamp - startTimestamp) * 1000;
  const durationString = `${duration.toFixed(3)}ms`;

  const unknownKeys = Object.keys(span).filter(key => {
    return !rawSpanKeys.has(key as any);
  });

  return (
    <SpanDetails>
      <table className="table key-value">
        <tbody>
          <Row title={t('Span ID')}>{span.span_id}</Row>
          <Row title={t('Parent Span ID')}>{span.parent_span_id || ''}</Row>
          <Row title={t('Trace ID')}>{span.trace_id}</Row>
          <Row title={t('Description')}>{span?.description ?? ''}</Row>
          <Row title={t('Start Date')}>
            {getDynamicText({
              fixed: 'Mar 16, 2020 9:10:12 AM UTC',
              value: (
                <Fragment>
                  <DateTime date={startTimestamp * 1000} />
                  {` (${startTimestamp})`}
                </Fragment>
              ),
            })}
          </Row>
          <Row title={t('End Date')}>
            {getDynamicText({
              fixed: 'Mar 16, 2020 9:10:13 AM UTC',
              value: (
                <Fragment>
                  <DateTime date={endTimestamp * 1000} />
                  {` (${endTimestamp})`}
                </Fragment>
              ),
            })}
          </Row>
          <Row title={t('Duration')}>{durationString}</Row>
          <Row title={t('Operation')}>{span.op || ''}</Row>
          <Row title={t('Same Process as Parent')}>
            {String(!!span.same_process_as_parent)}
          </Row>
          <Tags span={span} />
          {map(span?.data ?? {}, (value, key) => (
            <Row title={key} key={key}>
              {JSON.stringify(value, null, 4) || ''}
            </Row>
          ))}
          {unknownKeys.map(key => (
            <Row title={key} key={key}>
              {JSON.stringify(span[key], null, 4) || ''}
            </Row>
          ))}
        </tbody>
      </table>
    </SpanDetails>
  );
};

export default SpanDetailContent;
