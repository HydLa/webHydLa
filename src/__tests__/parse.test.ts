import { parse, Env, Constant } from '../hydat/parse';

test('Constant(1)=1', () => {
  const one = new Constant(1);
  expect(one.getValue(new Map())).toBe(1);
});

test('1+1=2', () => {
  expect(parse('1+1').getValue(new Map())).toBe(2);
});

test('1*1=1', () => {
  expect(parse('1*1').getValue(new Map())).toBe(1);
});

test('1-1=0', () => {
  expect(parse('1-1').getValue(new Map())).toBe(0);
});

test('1/1=1', () => {
  expect(parse('1/1').getValue(new Map())).toBe(1);
});

test('1=1', () => {
  expect(parse('1').getValue(new Map())).toBe(1);
});

test('(1+1)=2', () => {
  expect(parse('(1+1)').getValue(new Map())).toBe(2);
});

test('(1*1)/1=1', () => {
  expect(parse('(1*1)/1').getValue(new Map())).toBe(1);
});

test('1^1=1', () => {
  expect(parse('1^1').getValue(new Map())).toBe(1);
});

test('-1=-1', () => {
  expect(parse('-1').getValue(new Map())).toBe(-1);
});

test('-1+-1=-2', () => {
  expect(parse('-1+-1').getValue(new Map())).toBe(-2);
});

test('Infinity=Infinity', () => {
  expect(parse('Infinity').getValue(new Map())).toBe(Infinity);
});

test('Pi=Math.PI', () => {
  expect(parse('Pi').getValue(new Map())).toBe(Math.PI);
});

test('E=Math.E', () => {
  expect(parse('E').getValue(new Map())).toBe(Math.E);
});

test('t=t', () => {
  const env: Env = new Map([['t', new Constant(1)]]);
  expect(parse('t').getValue(env)).toBe(1);
});

test('timer=timer', () => {
  const env: Env = new Map([['timer', new Constant(1)]]);
  expect(parse('timer').getValue(env)).toBe(1);
});

test('p[x,0,1]=p[x, 0, 1]', () => {
  const env: Env = new Map([['p[x, 0, 1]', new Constant(1)]]);
  expect(parse('p[x,0,1]').getValue(env)).toBe(1);
});

test('x0=x0', () => {
  const env: Env = new Map([['x0', new Constant(1)]]);
  expect(parse('x0').getValue(env)).toBe(1);
});

test('Log[10]=Math.log(10)', () => {
  expect(parse('Log[10]').getValue(new Map())).toBe(Math.log(10));
});

test('Sin[10]=Math.sin(10)', () => {
  expect(parse('Sin[10]').getValue(new Map())).toBe(Math.sin(10));
});

test('Cos[10]=Math.cos(10)', () => {
  expect(parse('Cos[10]').getValue(new Map())).toBe(Math.cos(10));
});

test('Tan[10]=Math.tan(10)', () => {
  expect(parse('Tan[10]').getValue(new Map())).toBe(Math.tan(10));
});

test('Floor[E]=2', () => {
  expect(parse('Floor[E]').getValue(new Map())).toBe(2);
});

test('complicated', () => {
  const env: Env = new Map([
    ['t', new Constant(1)],
    ['p[v, 0, 1]', new Constant(1)],
    ['p[ht, 0, 1]', new Constant(1)],
  ]);
  expect(
    parse(
      '(t * (-1250) + 125 * p[v, 0, 1] + 613 * (20 * p[ht, 0, 1] + p[v, 0, 1] ^ 2) ^ (1/2))*(t*(-250)+25*p[v, 0, 1]+97*(20*p[ht, 0, 1]+p[v, 0, 1]^2)^(1/2))*(-1)/62500'
    ).getValue(env)
  ).toBe(-5.914890792978555);
});
