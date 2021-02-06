import { Construct, Constant } from '../parse';

test('Constant(1)=1', () => {
  const one = new Constant(1);
  expect(one.getValue({})).toBe(1);
});

test('1+1=2', () => {
  expect(Construct.parse('1+1').getValue({})).toBe(2);
});

test('1*1=1', () => {
  expect(Construct.parse('1*1').getValue({})).toBe(1);
});

test('1-1=0', () => {
  expect(Construct.parse('1-1').getValue({})).toBe(0);
});

test('1/1=1', () => {
  expect(Construct.parse('1/1').getValue({})).toBe(1);
});

test('1=1', () => {
  expect(Construct.parse('1').getValue({})).toBe(1);
});

test('(1+1)=2', () => {
  expect(Construct.parse('(1+1)').getValue({})).toBe(2);
});

test('(1*1)/1=1', () => {
  expect(Construct.parse('(1*1)/1').getValue({})).toBe(1);
});

test('1^1=1', () => {
  expect(Construct.parse('1^1').getValue({})).toBe(1);
});

test('-1=-1', () => {
  expect(Construct.parse('-1').getValue({})).toBe(-1);
});

test('-1+-1=-2', () => {
  expect(Construct.parse('-1+-1').getValue({})).toBe(-2);
});

test('Infinity=Infinity', () => {
  expect(Construct.parse('Infinity').getValue({})).toBe(Infinity);
});

test('Pi=Math.PI', () => {
  expect(Construct.parse('Pi').getValue({})).toBe(Math.PI);
});

test('E=Math.E', () => {
  expect(Construct.parse('E').getValue({})).toBe(Math.E);
});

test('t=t', () => {
  expect(Construct.parse('t').getValue({ ['t']: new Constant(1) })).toBe(1);
});

test('timer=timer', () => {
  expect(Construct.parse('timer').getValue({ ['timer']: new Constant(1) })).toBe(1);
});

test('p[x,0,1]=p[x, 0, 1]', () => {
  expect(Construct.parse('p[x,0,1]').getValue({ ['p[x, 0, 1]']: new Constant(1) })).toBe(1);
});

test('x0=x0', () => {
  expect(Construct.parse('x0').getValue({ ['x0']: new Constant(1) })).toBe(1);
});

test('Log[10]=Math.log(10)', () => {
  expect(Construct.parse('Log[10]').getValue({})).toBe(Math.log(10));
});

test('Sin[10]=Math.sin(10)', () => {
  expect(Construct.parse('Sin[10]').getValue({})).toBe(Math.sin(10));
});

test('Cos[10]=Math.cos(10)', () => {
  expect(Construct.parse('Cos[10]').getValue({})).toBe(Math.cos(10));
});

test('Tan[10]=Math.tan(10)', () => {
  expect(Construct.parse('Tan[10]').getValue({})).toBe(Math.tan(10));
});

test('Floor[E]=2', () => {
  expect(Construct.parse('Floor[E]').getValue({})).toBe(2);
});

test('complicated', () => {
  expect(
    Construct.parse(
      '(t * (-1250) + 125 * p[v, 0, 1] + 613 * (20 * p[ht, 0, 1] + p[v, 0, 1] ^ 2) ^ (1/2))*(t*(-250)+25*p[v, 0, 1]+97*(20*p[ht, 0, 1]+p[v, 0, 1]^2)^(1/2))*(-1)/62500'
    ).getValue({ ['t']: new Constant(1), ['p[v, 0, 1]']: new Constant(1), ['p[ht, 0, 1]']: new Constant(1) })
  ).toBe(-5.914890792978555);
});
