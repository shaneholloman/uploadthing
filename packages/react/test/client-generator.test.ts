import { expectTypeOf, it } from "vitest";
import * as z from "zod";

import { createUploadthing } from "uploadthing/server";
import type { ClientUploadedFileData } from "uploadthing/types";

import { generateReactHelpers } from "../src";

const doNotExecute = (_fn: (...args: any[]) => any) => {
  // noop
};

const f = createUploadthing();

const _router = {
  exampleRoute: f(["image"])
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(() => {
      return { foo: "bar" as const };
    }),

  withFooInput: f(["image"], { awaitServerData: false })
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => ({ number: opts.input.foo.length }))
    .onUploadComplete(() => {
      return { baz: "qux" as const };
    }),

  withBarInput: f(["image"], { awaitServerData: false })
    .input(z.object({ bar: z.number() }))
    .middleware((opts) => ({ square: opts.input.bar * opts.input.bar }))
    .onUploadComplete(() => {
      //
    }),

  withTransformedInput: f(["image"], { awaitServerData: false })
    .input(z.object({ bar: z.number().transform(String) }))
    .middleware((opts) => {
      expectTypeOf(opts.input.bar).toBeString();
      return { string: opts.input.bar };
    })
    .onUploadComplete(() => {
      //
    }),

  // Should technically block returning undefined but there was
  // so many issues with getting everything to work so we just
  // serialize it as null on the other end...... JSON sucks
  returningUndefined: f(["image"]).onUploadComplete(() => undefined),
};

const { useUploadThing } = generateReactHelpers<typeof _router>();
// `new File` doesn't work in test env without custom config. This will do for now.
const files = [new Blob([""], { type: "image/png" }) as File];

it("typeerrors for invalid input", () => {
  doNotExecute(() => {
    // @ts-expect-error - Argument of type '"bad route"' is not assignable to parameter of type '"exampleRoute"'.ts(2345)
    useUploadThing("badRoute", {});
  });

  doNotExecute(() => {
    // Type should be good here since this is the route name
    const { startUpload } = useUploadThing("exampleRoute");

    // @ts-expect-error - there is no input on this endpoint
    void startUpload(files, { foo: "bar" });
  });

  doNotExecute(() => {
    const { startUpload } = useUploadThing("withFooInput");

    // @ts-expect-error - input should be required
    void startUpload(files);

    // @ts-expect-error - input is the wrong type
    void startUpload(files, 55);

    // @ts-expect-error - input matches another route, but not this one
    void startUpload(files, { bar: 1 });
  });
});

it("infers the input correctly", () => {
  doNotExecute(() => {
    const { startUpload } = useUploadThing("exampleRoute");

    // we must allow undefined here to avoid weird types in other places
    // but it should be optional
    type _Input = Parameters<typeof startUpload>[1];
    expectTypeOf<_Input>().toEqualTypeOf<undefined>();
    void startUpload(files);
    void startUpload(files, undefined);
  });

  doNotExecute(() => {
    const { startUpload } = useUploadThing("withFooInput");
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ foo: string }>();
    void startUpload(files, { foo: "bar" });
  });

  doNotExecute(() => {
    const { startUpload } = useUploadThing("withBarInput");
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ bar: number }>();
    void startUpload(files, { bar: 1 });
  });

  doNotExecute(() => {
    const { startUpload } = useUploadThing("withTransformedInput");
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ bar: number }>();
    void startUpload(files, { bar: 1 });
  });
});

it("infers output properly", () => {
  doNotExecute(async () => {
    // Type should be good here since this is the route name
    const { startUpload } = useUploadThing("exampleRoute");
    const res = await startUpload(files);
    // Undefined cause upload can silently throw and don't return anything
    expectTypeOf<ClientUploadedFileData<{ foo: "bar" }>[] | undefined>(res);
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing("withFooInput");
    const res = await startUpload(files, { foo: "bar" });
    expectTypeOf<ClientUploadedFileData<null>[] | undefined>(res);
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing("withBarInput");
    const res = await startUpload(files, { bar: 1 });
    expectTypeOf<ClientUploadedFileData<null>[] | undefined>(res);
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing("returningUndefined");
    const res = await startUpload(files);
    expectTypeOf<ClientUploadedFileData<null>[] | undefined>(res);
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing("withFooInput", {
      onClientUploadComplete: (res) => {
        expectTypeOf<ClientUploadedFileData<null>[]>(res);
      },
    });
    const res = await startUpload(files, { foo: "bar" });
    expectTypeOf<ClientUploadedFileData<null>[] | undefined>(res);
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing("withBarInput", {
      onClientUploadComplete: (res) => {
        expectTypeOf<ClientUploadedFileData<null>[]>(res);
      },
    });
    const res = await startUpload(files, { bar: 1 });
    expectTypeOf<ClientUploadedFileData<null>[] | undefined>(res);
  });
});

it("gets go-to-definition proxy as endpoint arg", () => {
  doNotExecute(async () => {
    const _ut = useUploadThing((routeRegistry) => routeRegistry.withFooInput);
    type _Input = Parameters<typeof _ut.startUpload>[1];
    expectTypeOf<_Input>().toEqualTypeOf<{ foo: string }>();
  });

  doNotExecute(async () => {
    const { startUpload } = useUploadThing(
      (routeRegistry) => routeRegistry.exampleRoute,
    );
    const res = await startUpload(files);
    expectTypeOf<ClientUploadedFileData<{ foo: "bar" }>[] | undefined>(res);
  });
});
