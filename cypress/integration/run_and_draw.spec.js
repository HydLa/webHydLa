/* eslint-disable max-lines-per-function */
/* eslint-disable no-undef */
/* eslint-disable jest/expect-expect */

// TODO: input要素の取得の仕方

describe('run and draw', () => {
  it('check run', () => {
    cy.visit('/'); // 'http://localhost:5000'の'/'
    cy.contains('RUN').click();
    cy.wait(2000);
  });

  it('check show scale label', () => {
    cy.visit('/');

    cy.contains('show scale label').click();
    cy.wait(1000);
    cy.contains('show scale label').click();
    cy.wait(1000);
  });

  it('check auto rotate and XY-mode', () => {
    cy.visit('/');

    cy.contains('auto rotate').click();
    cy.wait(1000);
    cy.contains('auto rotate').click();
    cy.wait(1000);

    cy.contains('XY-mode').click();
    cy.wait(1000);
  });

  it('check stop', () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(2000);

    cy.contains('stop').click();
    cy.wait(1000);
    cy.contains('stop').click();
    cy.wait(1000);
  });

  it('check plot interval', () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(2000);

    cy.get('#dat-gui li:first input').type('{selectall}{del}1{enter}');
    cy.wait(1000);
    cy.get('#dat-gui li:first input').type('{selectall}{del}0.01{enter}');
    cy.wait(1000);
  });

  it('check line width', () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(2000);

    cy.get('#dat-gui > div > ul > li:nth-child(2) input').type('{selectall}{del}3{enter}');
    cy.wait(1000);
    cy.get('#dat-gui > div > ul > li:nth-child(2) input').type('{selectall}{del}1{enter}');
    cy.wait(1000);
  });

  it("plot y'", () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(2000);

    cy.contains('add new line').click();
    cy.get('#dat-gui .folder .folder:nth-child(3) li:nth-child(3) input').type('t');
    cy.get('#dat-gui .folder .folder:nth-child(3) li:nth-child(4) input').type("y'");
    cy.get('#dat-gui .folder .folder:nth-child(3) li:nth-child(5) input').type('0{enter}');
    cy.wait(1000);
  });

  it('check dynamic draw', () => {
    cy.visit('/');
    cy.contains('RUN').click();
    cy.wait(2000);

    cy.contains('dynamic draw').click();
    cy.wait(5000);
    cy.get('#dat-gui > div > ul > li:nth-child(2) input').type('{selectall}{del}3{enter}');
    cy.wait(5000);
  });

  it('check example and parameter', () => {
    cy.visit('/');

    cy.contains('Save/Load').click();
    cy.contains('Examples').click();
    cy.get('#modal_examples input').click();
    cy.contains('bouncing_particle_rp.hydla').click();
    cy.get('#modal_examples').contains('Load').click();

    cy.contains('RUN').click();
    cy.get('#dat-gui .folder .folder:nth-child(2) li:nth-child(4) input').type('{selectall}{del}ht{enter}');
    cy.wait(1000);

    cy.contains('fixed').click();
    cy.wait(1000);
    cy.contains('range').click();
    cy.wait(1000);
    cy.contains('range').click();
    cy.wait(1000);
    cy.contains('fixed').click();
    cy.wait(1000);
  });
});
