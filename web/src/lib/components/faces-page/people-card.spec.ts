import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { renderWithTooltips } from '$tests/helpers';
import { personFactory } from '@test-data/factories/person-factory';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PeopleCard from './people-card.svelte';

describe('PeopleCard component', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const buildCard = (isHidden: boolean) => {
    const user = userEvent.setup();

    const person = personFactory.build({ isHidden, isFavorite: false });
    const onMergePeople = vi.fn();
    const onTogglePerson = vi.fn();
    const onToggleFavorite = vi.fn();

    const result = renderWithTooltips(PeopleCard, {
      person,
      onMergePeople,
      onTogglePerson,
      onToggleFavorite,
    });

    return { ...result, onTogglePerson, user };
  };

  it('shows "hide_person" option when a visible person card menu is opened', async () => {
    const { getByRole, findByRole, user } = buildCard(false);

    const card = getByRole('group');
    await user.hover(card);

    const optionsButton = await findByRole('button', { name: /show_person_options/i });
    await user.click(optionsButton);

    const hideItem = await findByRole('menuitem', { name: /hide_person/i });
    expect(hideItem).toBeVisible();
  });

  it('shows "unhide_person" option when a hidden person card menu is opened', async () => {
    const { getByRole, findByRole, user } = buildCard(true);

    const card = getByRole('group');
    await user.hover(card);

    const optionsButton = await findByRole('button', { name: /show_person_options/i });
    await user.click(optionsButton);

    const unhideItem = await findByRole('menuitem', { name: /unhide_person/i });
    expect(unhideItem).toBeVisible();
  });

  it('calls onTogglePerson when the hide/show option is clicked', async () => {
    const { getByRole, findByRole, onTogglePerson, user } = buildCard(false);

    const card = getByRole('group');
    await user.hover(card);

    const optionsButton = await findByRole('button', { name: /show_person_options/i });
    await user.click(optionsButton);

    const hideItem = await findByRole('menuitem', { name: /hide_person/i });
    await user.click(hideItem);

    expect(onTogglePerson).toHaveBeenCalledOnce();
  });
});
