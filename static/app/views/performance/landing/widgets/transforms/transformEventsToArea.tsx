import mean from 'lodash/mean';

import {RenderProps} from 'app/components/charts/eventsRequest';
import {getParams} from 'app/components/organizations/globalSelectionHeader/getParams';
import {Series} from 'app/types/echarts';
import {defined} from 'app/utils';
import {axisLabelFormatter} from 'app/utils/discover/charts';
import {aggregateOutputType} from 'app/utils/discover/fields';

import {WidgetDataConstraint, WidgetPropUnion} from '../types';

export function transformEventsRequestToArea<T extends WidgetDataConstraint>(
  widgetProps: WidgetPropUnion<T>,
  props: RenderProps
) {
  const {fields: chartFields} = widgetProps;
  const {start, end, utc, interval, statsPeriod} = getParams(widgetProps.location.query);

  const loading = props.loading;
  const errored = props.errored;
  const data: Series[] = props.timeseriesData as Series[];
  const previousData = props.previousTimeseriesData;

  const dataMean = data?.map(series => {
    const meanData = mean(series.data.map(({value}) => value));

    return {
      mean: meanData,
      outputType: aggregateOutputType(series.seriesName),
      label: axisLabelFormatter(meanData, series.seriesName),
    };
  });

  const childData = {
    loading,
    errored,
    isLoading: loading,
    isErrored: errored,
    hasData: defined(data) && !!data[0].data.length,
    data,
    previousData: previousData ? previousData : undefined,
    dataMean,

    utc: utc === 'true',
    interval,
    statsPeriod: statsPeriod ?? undefined,
    start: start ?? '',
    end: end ?? '',
    field: chartFields[0],
  };

  return childData;
}