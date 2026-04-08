import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  color: '#f1f1f1',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const inputErrorStyle = {
  ...inputStyle,
  border: '1px solid #f87171',
};

const validatePassword = (password) => {
  const rules = [
    { test: /.{8,}/, label: 'Mínimo 8 caracteres' },
    { test: /[A-Z]/, label: '1 letra maiúscula' },
    { test: /[a-z]/, label: '1 letra minúscula' },
    { test: /[0-9]/, label: '1 número' },
    { test: /[^A-Za-z0-9]/, label: '1 caractere especial' },
  ];
  return rules.map(r => ({ label: r.label, valid: r.test.test(password) }));
};

export const LoginPage = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const passwordRules = validatePassword(password);
  const passwordValid = passwordRules.every(r => r.valid);

  const handleSubmit = async () => {
    setError('');

    if (isRegister) {
      if (!name.trim()) { setError('Informe seu nome.'); return; }
      if (!email.trim()) { setError('Informe seu email.'); return; }
      if (!passwordValid) { setError('A senha não atende todos os requisitos.'); return; }
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Este email já está cadastrado.',
        'auth/invalid-email': 'Email inválido.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
        'auth/weak-password': 'Senha muito fraca.',
      };
      setError(msgs[e.code] || 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (e) {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPasswordRules(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '22rem',
          backgroundColor: '#111',
          border: '1px solid #1f1f1f',
          borderRadius: '1rem',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src="/assets/logo/logo-horizontal-light.png"
            alt="Luna Finance"
            style={{ height: '3.5rem', width: 'auto', objectFit: 'contain' }}
          />
          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
            {isRegister ? 'Crie sua conta' : 'Entre na sua conta'}
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

          {isRegister && (
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />

          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => { setPassword(e.target.value); if (isRegister) setShowPasswordRules(true); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={isRegister && showPasswordRules && !passwordValid ? inputErrorStyle : inputStyle}
            />

            {isRegister && showPasswordRules && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#161616',
                borderRadius: '0.5rem',
                border: '1px solid #2a2a2a',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
              }}>
                {passwordRules.map(rule => (
                  <div key={rule.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: rule.valid ? '#4ade80' : '#6b7280' }}>
                      {rule.valid ? '✓' : '○'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: rule.valid ? '#4ade80' : '#6b7280' }}>
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isRegister && (
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={
                confirmPassword && password !== confirmPassword
                  ? inputErrorStyle
                  : inputStyle
              }
            />
          )}

          {isRegister && confirmPassword && password !== confirmPassword && (
            <p style={{ color: '#f87171', fontSize: '0.7rem', margin: 0 }}>As senhas não coincidem.</p>
          )}
          {isRegister && confirmPassword && password === confirmPassword && (
            <p style={{ color: '#4ade80', fontSize: '0.7rem', margin: 0 }}>✓ Senhas coincidem.</p>
          )}
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>
            {error}
          </p>
        )}

        {/* Botão principal */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: loading ? '#145530' : '#1a6b3c',
            color: '#fff',
            fontWeight: '600',
            fontSize: '0.875rem',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2a2a2a' }} />
          <span style={{ color: '#4b5563', fontSize: '0.75rem' }}>ou</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#2a2a2a' }} />
        </div>

        {/* Botão Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            backgroundColor: '#1a1a1a',
            color: '#f1f1f1',
            fontWeight: '500',
            fontSize: '0.875rem',
            border: '1px solid #2a2a2a',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continuar com Google
        </button>

        {/* Alternar modo */}
        <p
          onClick={switchMode}
          style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#6b7280',
            cursor: 'pointer',
            margin: 0,
          }}
        >
          {isRegister ? 'Já tem conta? ' : 'Não tem conta? '}
          <span style={{ color: '#4ade80', fontWeight: '600' }}>
            {isRegister ? 'Entrar' : 'Criar conta'}
          </span>
        </p>
      </div>
    </div>
  );
};