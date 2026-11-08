import { useId } from 'react'

// Se puede usar en registro, perfil, publicación y edición.
// No depende del estilo del control nativo de Windows.
export default function PhotoFileField({
  onChange,
  disabled = false,
  multiple = false,
  label,
  count = 0,
}) {
  const id = useId()
  const texto = label || (multiple ? 'Seleccionar fotografías' : 'Elegir fotografía')
  return (
    <div className="vecired-photo-field">
      <input
        id={id}
        type="file"
        className="vecired-photo-input"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
      />
      <label className={`vecired-photo-button${disabled ? ' is-disabled' : ''}`} htmlFor={id}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.4" />
          <path d="m4 17 5-5 4 4 3-3 4 4" />
        </svg>
        <span>{texto}</span>
      </label>
      <span className="vecired-photo-hint">
        {count ? `${count} ${count === 1 ? 'fotografía seleccionada' : 'fotografías seleccionadas'}` : 'JPG, PNG o WebP · hasta 5 MB por foto'}
      </span>
    </div>
  )
}
