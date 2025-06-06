import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";

import { doNotExecute } from "../__test-helpers";
import { createBuilder } from "../../src/_internal/upload-builder";
import { genUploader } from "../../src/client";
import type { ClientUploadedFileData, FileRouter } from "../../src/types";

describe("genuploader", () => {
  const f = createBuilder();

  const _router = {
    uploadable1: f(["image", "video"], {
      awaitServerData: false,
    }).onUploadComplete(() => {
      return { foo: "bar" as const };
    }),
    uploadable2: f(["image"])
      .input(z.object({ foo: z.number() }))
      .onUploadComplete(() => {
        return { baz: "qux" as const };
      }),
  } satisfies FileRouter;

  const { uploadFiles } = genUploader<typeof _router>({
    url: "0.0.0.0",
    package: "test",
  });
  const files = [new File([""], "file1"), new File([""], "file2")];

  it("typeerrors for invalid input", () => {
    doNotExecute(async () => {
      // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
      await uploadFiles("random", { files });
    });

    doNotExecute(async () => {
      // @ts-expect-error - Input should be required here
      const res = await uploadFiles("uploadable2", { files });
      expectTypeOf<ClientUploadedFileData<{ baz: "qux" }>[]>(res);
    });
  });

  it("types serverData as null if polling is skipped", () => {
    doNotExecute(async () => {
      const res = await uploadFiles("uploadable1", { files });
      expectTypeOf<ClientUploadedFileData<null>[]>(res);
    });
  });
});
