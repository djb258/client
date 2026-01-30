/*
 * CTB Metadata
 * ctb_id: CTB-89399BD571FC
 * ctb_branch: ui
 * ctb_path: ui/src/components/wizard/steps/HRToneSetupStep.tsx
 * ctb_version: 1.0.0
 * created: 2025-10-23T16:37:01.915604
 * checksum: fe15a7f2
 */

// Step 2: HR Tone Setup

import React, { useState } from 'react';
import { HRTone } from '../../../firebase/types/firestore';

interface HRToneSetupStepProps {
  hrTone: HRTone;
  onNext: (data: { hr_tone: HRTone }) => void;
  onBack: () => void;
}

const HRToneSetupStep: React.FC<HRToneSetupStepProps> = ({
  hrTone,
  onNext,
  onBack
}) => {
  const [formData, setFormData] = useState<HRTone>(hrTone);
  const [samplePhrase, setSamplePhrase] = useState('');

  const handleToneChange = (tone: HRTone['tone']) => {
    setFormData(prev => ({ ...prev, tone }));
  };

  const addSamplePhrase = () => {
    if (samplePhrase.trim()) {
      setFormData(prev => ({
        ...prev,
        sample_phrases: [...(prev.sample_phrases || []), samplePhrase.trim()]
      }));
      setSamplePhrase('');
    }
  };

  const removeSamplePhrase = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sample_phrases: prev.sample_phrases?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ hr_tone: formData });
  };

  return (
    <div className="wizard-step hr-tone-setup-step">
      <h2>Step 2: HR Communication Style</h2>
      <p>Define how this company prefers to communicate with employees.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Communication Tone</label>
          <div className="tone-options">
            {(['formal', 'professional', 'friendly', 'casual'] as const).map(tone => (
              <label key={tone} className="radio-option">
                <input
                  type="radio"
                  name="tone"
                  value={tone}
                  checked={formData.tone === tone}
                  onChange={() => handleToneChange(tone)}
                />
                <span>{tone.charAt(0).toUpperCase() + tone.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="preferred_salutation">Preferred Salutation</label>
          <input
            id="preferred_salutation"
            type="text"
            value={formData.preferred_salutation || ''}
            onChange={e =>
              setFormData(prev => ({ ...prev, preferred_salutation: e.target.value }))
            }
            placeholder="Dear Team Member, Hi [Name], etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="communication_style">Communication Style Notes</label>
          <textarea
            id="communication_style"
            value={formData.communication_style || ''}
            onChange={e =>
              setFormData(prev => ({ ...prev, communication_style: e.target.value }))
            }
            placeholder="Additional notes about communication preferences..."
            rows={4}
          />
        </div>

        <div className="form-section">
          <h3>Sample Phrases</h3>
          <p className="help-text">
            Add sample phrases this company commonly uses in HR communications.
          </p>

          <div className="phrase-input-group">
            <input
              type="text"
              value={samplePhrase}
              onChange={e => setSamplePhrase(e.target.value)}
              placeholder="Enter a sample phrase..."
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addSamplePhrase())}
            />
            <button type="button" onClick={addSamplePhrase} className="btn-add">
              Add Phrase
            </button>
          </div>

          {formData.sample_phrases && formData.sample_phrases.length > 0 && (
            <ul className="phrase-list">
              {formData.sample_phrases.map((phrase, index) => (
                <li key={index}>
                  <span>{phrase}</span>
                  <button
                    type="button"
                    onClick={() => removeSamplePhrase(index)}
                    className="btn-remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="btn-secondary">
            Back
          </button>
          <button type="submit" className="btn-primary">
            Next: Employee Intake
          </button>
        </div>
      </form>
    </div>
  );
};

export default HRToneSetupStep;