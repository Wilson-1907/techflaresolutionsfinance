type Stage = {
  title: string;
  description?: string;
  cost?: number;
  quantity?: number;
  dueDate?: string | null;
};

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function fail(errors: string[]): ValidationResult {
  return { ok: false, errors };
}

export function validateDeliveryStages(stages: Stage[]): ValidationResult {
  const errors: string[] = [];
  if (stages.length === 0) {
    errors.push("Add at least one stage with title, unit price, quantity, and due date.");
    return fail(errors);
  }
  stages.forEach((s, i) => {
    const n = `Stage ${i + 1}`;
    if (!s.title?.trim()) errors.push(`${n}: title is required.`);
    if ((s.cost ?? 0) <= 0) errors.push(`${n}: unit price must be greater than 0.`);
    if ((s.quantity ?? 1) < 1) errors.push(`${n}: quantity must be at least 1.`);
    if (!s.dueDate?.trim()) errors.push(`${n}: due date (timeline) is required.`);
  });
  return errors.length ? fail(errors) : { ok: true };
}

export function validateFinanceSendReady(params: {
  clientEmail?: string | null;
  financeDocId?: string | null;
  stages: Stage[];
  depositPercent: number;
  requirePreparedInvoice?: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const stageVal = validateDeliveryStages(params.stages);
  if (!stageVal.ok) errors.push(...stageVal.errors);

  if (!params.clientEmail?.trim()) {
    errors.push("Client email is required before sending.");
  }
  if (params.requirePreparedInvoice !== false && !params.financeDocId) {
    errors.push("Prepare the invoice first before sending to the client.");
  }
  if (params.depositPercent < 1 || params.depositPercent > 100) {
    errors.push("Deposit % must be between 1 and 100.");
  }
  const total = params.stages.reduce((sum, s) => sum + (s.cost ?? 0) * (s.quantity ?? 1), 0);
  if (params.stages.length > 0 && total <= 0) {
    errors.push("Project total must be greater than 0.");
  }
  return errors.length ? fail(errors) : { ok: true };
}
