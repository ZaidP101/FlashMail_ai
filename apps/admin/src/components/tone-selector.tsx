import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export const TONES = [
  { value: '', label: 'None' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Formal', label: 'Formal' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Friendly', label: 'Friendly' },
  { value: 'Polite', label: 'Polite' },
  { value: 'Apologetic', label: 'Apologetic' },
  { value: 'Appreciative', label: 'Appreciative' },
  { value: 'Encouraging', label: 'Encouraging' },
  { value: 'Direct', label: 'Direct' },
  { value: 'Assertive', label: 'Assertive' },
  { value: 'Supportive', label: 'Supportive' },
  { value: 'Empathetic', label: 'Empathetic' },
  { value: 'Sarcastic', label: 'Sarcastic' },
  { value: 'Humorous', label: 'Humorous' },
] as const

type ToneSelectorProps = {
  value: string
  onChange: (value: string) => void
}

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="tone">Tone (Optional)</Label>
      <Select id="tone" value={value} onChange={(e) => onChange(e.target.value)}>
        {TONES.map((tone) => (
          <option key={tone.value} value={tone.value}>
            {tone.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
