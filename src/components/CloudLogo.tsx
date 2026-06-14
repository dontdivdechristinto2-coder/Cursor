export function CloudLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "cloud-logo cloud-logo--compact" : "cloud-logo"} aria-label="CopticCloud animated cloud">
      <span className="cloud-logo__halo" />
      <span className="cloud-logo__puff cloud-logo__puff--left" />
      <span className="cloud-logo__puff cloud-logo__puff--center" />
      <span className="cloud-logo__puff cloud-logo__puff--right" />
      <span className="cloud-logo__base" />
      <span className="cloud-logo__cross-vertical" />
      <span className="cloud-logo__cross-horizontal" />
    </div>
  );
}
