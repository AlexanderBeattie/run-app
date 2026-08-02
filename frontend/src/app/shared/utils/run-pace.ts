/** Banner gradient for a run pace. Shared by home search dropdown and run carousels. */
export function gradientForPace(pace?: string): string {
  const gradients: Record<string, string> = {
    easy:     'linear-gradient(135deg, #1D9E75 0%, #0a5c42 100%)',
    social:   'linear-gradient(135deg, #10B981 0%, #065f46 100%)',
    moderate: 'linear-gradient(135deg, #3B82F6 0%, #1e3a8a 100%)',
    fast:     'linear-gradient(135deg, #EF4444 0%, #7f1d1d 100%)',
    tempo:    'linear-gradient(135deg, #F59E0B 0%, #78350f 100%)',
  };
  return gradients[pace ?? ''] ?? 'linear-gradient(135deg, #1D9E75 0%, #0D0D0D 100%)';
}
