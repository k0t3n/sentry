import {mountWithTheme} from 'sentry-test/enzyme';

import RadioGroup from 'sentry/views/settings/components/forms/controls/radioGroup';

describe('RadioGroup', function () {
  it('renders', function () {
    const mock = jest.fn();
    const wrapper = mountWithTheme(
      <RadioGroup
        name="radio"
        label="test"
        value="choice_one"
        choices={[
          ['choice_one', 'Choice One'],
          ['choice_two', 'Choice Two'],
          ['choice_three', 'Choice Three'],
        ]}
        onChange={mock}
      />
    );
    expect(wrapper).toSnapshot();
  });

  it('renders disabled', function () {
    const mock = jest.fn();
    const wrapper = mountWithTheme(
      <RadioGroup
        name="radio"
        label="test"
        value="choice_one"
        disabled
        choices={[['choice_one', 'Choice One']]}
        onChange={mock}
      />
    );
    expect(wrapper).toSnapshot();

    expect(wrapper.find('RadioLineText').props().disabled).toBe(true);
    expect(wrapper.find('Radio').props().disabled).toBe(true);
  });

  it('can select a different item', function () {
    const mock = jest.fn();
    const wrapper = mountWithTheme(
      <RadioGroup
        name="radio"
        label="test"
        value="choice_three"
        choices={[
          ['choice_one', 'Choice One'],
          ['choice_two', 'Choice Two'],
          ['choice_three', 'Choice Three'],
        ]}
        onChange={mock}
      />
    );
    expect(wrapper).toSnapshot();
  });

  it('calls onChange when clicked', function () {
    const mock = jest.fn();

    const wrapper = mountWithTheme(
      <RadioGroup
        name="radio"
        label="test"
        value="choice_one"
        choices={[
          ['choice_one', 'Choice One'],
          ['choice_two', 'Choice Two'],
          ['choice_three', 'Choice Three'],
        ]}
        onChange={mock}
      />
    );
    wrapper.find('[role="radio"] Radio').last().simulate('change');
    expect(mock).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
  });
});
