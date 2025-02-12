import { TourScheduler } from '../../src/';
import createTour1 from './tours/tour1';
import createTour2 from './tours/tour2';

export const tourScheduler = new TourScheduler({
  tours: new Map([
    ['tour1', createTour1()],
    ['tour2', createTour2()],
  ]),
  stateHandler() {
    const showTour1 = localStorage.getItem('showTour1');

    if (showTour1 !== 'false') {
      return 'tour1';
    }
    else {
      return 'tour2';
    }
  },
  initialContext: {} as { globalMessage: number },
});

tourScheduler.startTour();
