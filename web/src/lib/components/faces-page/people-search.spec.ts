import { sdkMock } from '$lib/__mocks__/sdk.mock';
import { render } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PeopleSearch from './people-search.svelte';

describe('PeopleSearch component', () => {
  beforeEach(() => {
    sdkMock.searchPerson.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes withHidden=true to searchPerson API when prop is set', async () => {
    const user = userEvent.setup();

    const { getByRole } = render(PeopleSearch, {
      type: 'input',
      searchName: '',
      searchedPeopleLocal: [],
      withHidden: true,
    });

    await user.type(getByRole('textbox'), 'a');

    await vi.waitFor(() =>
      expect(sdkMock.searchPerson).toHaveBeenCalledWith(
        expect.objectContaining({ withHidden: true }),
        expect.anything(),
      ),
    );
  });

  it('passes withHidden=false to searchPerson API by default', async () => {
    const user = userEvent.setup();

    const { getByRole } = render(PeopleSearch, {
      type: 'input',
      searchName: '',
      searchedPeopleLocal: [],
    });

    await user.type(getByRole('textbox'), 'a');

    await vi.waitFor(() =>
      expect(sdkMock.searchPerson).toHaveBeenCalledWith(
        expect.objectContaining({ withHidden: false }),
        expect.anything(),
      ),
    );
  });
});
