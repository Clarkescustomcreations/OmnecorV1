import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc.js";

export const meshRouter = router({
  /**
   * Get all currently discovered nodes in the Omnecor mesh.
   */
  getNodes: publicProcedure.query(async ({ ctx }) => {
    return ctx.services.mesh.getNodes();
  }),
});
