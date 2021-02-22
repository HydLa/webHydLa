/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */

describe('run and draw', () => {
  it('check auto rotate', () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(1000);

    cy.contains('auto rotate').click();
    cy.wait(1000);
    cy.contains('auto rotate').click();
  });
});
