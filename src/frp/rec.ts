import { Observable, ReplaySubject } from "rxjs";

interface ScopeDef {
  [key: string]: any;
}
type Scope<Def extends ScopeDef> = { [P in keyof Def]: Observable<Def[P]> };
type PrivScope<Def extends ScopeDef> = {
  [P in keyof Def]: ReplaySubject<Def[P]>
};

const mkScope = <Def>(): Scope<Def> => {
  const target = {} as PrivScope<Def>;
  const handler = {
    get: (_: any, prop: keyof Def) => {
      if (!target[prop]) {
        target[prop] = new ReplaySubject<Def[typeof prop]>();
      }
      return target[prop];
    },
    set: (_: any, prop: keyof Def, value: Scope<Def>[typeof prop]) => {
      if (!target[prop]) {
        target[prop] = new ReplaySubject<Def[typeof prop]>();
      }
      const subject = target[prop];
      value.subscribe(subject.next.bind(subject) as typeof subject.next);
      return true;
    },
  };
  return new Proxy({} as Scope<Def>, handler);
};

export const rec = <Def extends ScopeDef>() => {
  const scope = mkScope<Def>();
  return <R>(handler: (scope: Scope<Def>) => R): R => handler(scope);
};
