// Minimal i18n helper. Keys are the source of truth; default locale is pt-BR.
// To add a locale, drop another dictionary into `dicts` and switch via setLocale.
import { useSyncExternalStore } from "react";

type Dict = Record<string, string>;

const pt: Dict = {
  // Navbar
  "nav.verify": "Verificar atleta",
  "nav.how": "Como funciona",
  "nav.forOrgs": "Para organizações",
  "nav.orgs": "Organizações",
  "nav.login": "Entrar",
  "nav.cta": "Cadastre sua organização",

  // Hero
  "hero.badge": "CERTIFICAÇÃO ESPORTIVA → ORGANIZAÇÕES DE ARTES MARCIAIS",
  "hero.title.1": "A graduação do seu atleta,",
  "hero.title.2": "registrada, verificável,",
  "hero.title.3": "imutável.",
  "hero.subtitle":
    "FightPort é o passaporte digital de graduações para academias e federações de artes marciais. Cada faixa registrada vira um certificado verificável publicamente — para sempre.",
  "hero.cta.primary": "Cadastre sua organização",
  "hero.cta.secondary": "Verificar um atleta",
  "hero.stats.athletes": "atletas certificados",
  "hero.stats.orgs": "organizações ativas",
  "hero.stats.grads": "graduações registradas",

  // Social proof
  "social.title": "ORGANIZAÇÕES ATIVAS EM →",

  // Problem
  "problem.title": "O problema é grande. E silencioso.",
  "problem.s1.num": "72%",
  "problem.s1.text": "dos praticantes de BJJ relatam dúvida sobre a legitimidade de uma faixa exibida.",
  "problem.s1.source": "Pesquisa interna FightPort, 2024",
  "problem.s2.num": "50%",
  "problem.s2.text": "das academias ainda registram graduações apenas em planilhas ou no papel.",
  "problem.s2.source": "SportCombat Industry Report, 2024",
  "problem.s3.num": "5 anos",
  "problem.s3.text": "é o tempo médio para uma faixa preta ser conquistada — e zero é o tempo para perdê-la num sistema sem rastro.",
  "problem.s3.source": "IBJJF / observação de campo",

  // Solution
  "solution.title": "Uma plataforma. Três certezas.",
  "solution.c1.title": "Verificação instantânea",
  "solution.c1.desc":
    "Compartilhe um link. Em 2 segundos qualquer pessoa confirma a graduação do atleta, sem login, sem fricção.",
  "solution.c2.title": "Imutável por criptografia",
  "solution.c2.desc":
    "Cada graduação gera um hash único. Não é editável, não é falsificável, e fica vinculada para sempre à organização emissora.",
  "solution.c3.title": "Passaporte vitalício",
  "solution.c3.desc":
    "O atleta leva o histórico para qualquer academia, federação ou país. Um único ID — FP-ID — acompanha a carreira.",

  // How it works
  "how.title": "Como funciona",
  "how.s1.title": "Sua organização cadastra atletas",
  "how.s1.desc": "Importe planilha ou cadastre manualmente. Vincule à modalidade e à faixa atual.",
  "how.s2.title": "Você registra cada graduação",
  "how.s2.desc": "Selecione faixa, data e responsável. O sistema gera o hash e notifica o atleta automaticamente.",
  "how.s3.title": "Qualquer pessoa verifica",
  "how.s3.desc": "O passaporte público fica disponível em fightport.pro/p/FP-ID — para clubes, juízes, mídia, todos.",

  // Search
  "search.title": "Verificar um atleta",
  "search.subtitle": "Busque por nome, FP-ID ou organização emissora.",
  "search.placeholder": "Ex: João da Silva, FP-2025-A1B2C3 ou Gracie Barra",
  "search.button": "Buscar",
  "search.empty.title": "Nenhum atleta encontrado",
  "search.empty.desc": "Tente outro termo ou peça à sua organização para te cadastrar no FightPort.",
  "search.empty.cta": "Cadastre sua organização",
  "search.col.athlete": "Atleta",
  "search.col.id": "ID",
  "search.col.org": "Organização",
  "search.col.belt": "Faixa",

  // Pricing
  "pricing.title": "Planos por crédito de graduação",
  "pricing.subtitle": "Compra única. Sem mensalidade. Cada crédito = uma graduação registrada para sempre.",
  "pricing.popular": "MAIS POPULAR",
  "pricing.p1.name": "Starter",
  "pricing.p2.name": "Equipe",
  "pricing.p3.name": "Organização",
  "pricing.credits": "créditos de graduação",
  "pricing.cta": "Começar",
  "pricing.included.1": "Atletas ilimitados cadastrados",
  "pricing.included.2": "Passaportes públicos verificáveis",
  "pricing.included.3": "Carteirinhas digitais (PDF)",
  "pricing.included.4": "Suporte por e-mail",

  // Testimonials
  "test.title": "O que as academias falam",
  "test.q1": "Resolveu um problema que a gente carregava há anos. Agora todo aluno sai daqui com a graduação rastreável.",
  "test.a1": "Mestre Rafael — Gracie Premium SP",
  "test.q2": "Nossos campeonatos pediam comprovação física. Hoje basta um QR code.",
  "test.a2": "Coach Marina — CT Phoenix",
  "test.q3": "Adotamos pra federação inteira. Padronizou tudo.",
  "test.a3": "Presidência — FBJJRJ",

  // CTA
  "cta.title": "Sua organização merece isso.",
  "cta.subtitle": "Comece hoje. Registre a primeira graduação em menos de 5 minutos.",
  "cta.button": "Cadastrar minha organização",

  // Footer
  "footer.product": "Produto",
  "footer.product.how": "Como funciona",
  "footer.product.pricing": "Planos",
  "footer.product.verify": "Verificar atleta",
  "footer.company": "Empresa",
  "footer.company.about": "Sobre",
  "footer.company.contact": "Contato",
  "footer.legal": "Legal",
  "footer.legal.terms": "Termos de uso",
  "footer.legal.privacy": "Privacidade & LGPD",
  "footer.copy": "© {year} FightPort · uma plataforma SportCombat",

  // Passport
  "pass.verified": "VERIFICADO",
  "pass.verifyOther": "Verificar outro atleta",
  "pass.share": "Compartilhar",
  "pass.shareCopied": "Link copiado para a área de transferência",
  "pass.qr": "QR Code",
  "pass.qr.title": "Aponte a câmera para verificar",
  "pass.download": "Baixar Carteirinha",
  "pass.currentBelt": "Faixa atual",
  "pass.timeline": "Histórico de graduações",
  "pass.mostRecent": "MAIS RECENTE",
  "pass.empty": "Sem conquistas registradas ainda.",
  "pass.gradBy": "graduado por",
  "pass.footer": "Certificado emitido por {school} via fightport.pro · SportCombat",
  "pass.notFound.title": "Atleta não encontrado",
  "pass.notFound.desc": "O FP-ID informado não existe ou foi removido.",
  "pass.notFound.cta": "Voltar para o início",

  // Cadastro
  "cad.left.title": "A graduação do seu atleta merece um registro imutável.",
  "cad.left.b1": "Passaporte público em segundos",
  "cad.left.b2": "Carteirinha digital com QR Code",
  "cad.left.b3": "Histórico vitalício do atleta",
  "cad.left.b4": "Compra única, sem mensalidade",
  "cad.left.quote": "“A maior tradição das artes marciais agora tem a tecnologia que ela merece.”",
  "cad.tab.signup": "Cadastrar organização",
  "cad.tab.login": "Entrar",
  "cad.signup.title": "Cadastre sua organização",
  "cad.signup.subtitle": "Comece grátis. Compre créditos quando precisar registrar a primeira graduação.",
  "cad.signup.org": "Nome da organização",
  "cad.signup.coach": "Nome do head coach",
  "cad.signup.art": "Arte marcial",
  "cad.signup.grad": "Sua graduação",
  "cad.signup.email": "E-mail",
  "cad.signup.password": "Senha",
  "cad.signup.passwordHint": "Mínimo 8 caracteres",
  "cad.signup.submit": "Criar minha organização",
  "cad.signup.haveAccount": "Já tem conta?",
  "cad.signup.toLogin": "Entrar",
  "cad.confirm.title": "Verifique seu e-mail",
  "cad.confirm.desc":
    "Enviamos um link de confirmação para {email}. Clique no link para ativar sua organização.",
  "cad.confirm.cta": "Voltar para o login",
  "cad.login.title": "Entrar na sua organização",
  "cad.login.subtitle": "Acesse o painel da sua academia ou o portal do atleta.",
  "cad.login.email": "E-mail",
  "cad.login.password": "Senha",
  "cad.login.submit": "Entrar",
  "cad.login.forgot": "Esqueci minha senha",
  "cad.login.noAccount": "Ainda não tem conta?",
  "cad.login.toSignup": "Cadastrar organização",
  "cad.forgot.title": "Recuperar senha",
  "cad.forgot.desc": "Informe seu e-mail e enviaremos um link para criar uma nova senha.",
  "cad.forgot.cta": "Enviar link",
  "cad.forgot.sent": "Se este e-mail existir, você receberá o link em instantes.",
  "cad.forgot.back": "Voltar ao login",

  // Reset
  "reset.title": "Definir nova senha",
  "reset.new": "Nova senha",
  "reset.confirm": "Confirmar senha",
  "reset.submit": "Salvar nova senha",
  "reset.mismatch": "As senhas não coincidem.",
  "reset.weak": "A senha precisa ter ao menos 8 caracteres.",
  "reset.success": "Senha alterada. Redirecionando…",

  // Static pages
  "sobre.title": "Sobre o FightPort",
  "sobre.back": "Voltar para o início",
  "sobre.body":
    "O FightPort é a plataforma de certificação esportiva da SportCombat. Nascemos para resolver um problema antigo das artes marciais: como provar, com solidez, a graduação de um atleta. Cada faixa registrada na plataforma gera um certificado imutável, verificável publicamente e vinculado para sempre à organização emissora.",
  "sobre.mission":
    "Nossa missão é dar às academias, federações e atletas a infraestrutura digital que o esporte de combate sempre mereceu.",
  "contato.title": "Fale com a gente",
  "contato.name": "Seu nome",
  "contato.email": "E-mail",
  "contato.subject": "Assunto",
  "contato.message": "Mensagem",
  "contato.send": "Enviar mensagem",
  "contato.sent": "Mensagem enviada. Responderemos em até 24h úteis.",
  "termos.title": "Termos de uso",
  "termos.updated": "Atualizado em 28/05/2026",
  "priv.title": "Privacidade & LGPD",
  "priv.updated": "Atualizado em 28/05/2026",

  // Common
  "common.loading": "Carregando…",
  "common.error": "Algo deu errado. Tente novamente.",
  "common.back": "Voltar",
};

const dicts: Record<string, Dict> = { "pt-BR": pt };

let current = "pt-BR";
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => current;

export function setLocale(loc: string) {
  if (!dicts[loc]) return;
  current = loc;
  listeners.forEach((l) => l());
}

export function getLocale() {
  return current;
}

export function getAvailableLocales() {
  return Object.keys(dicts);
}

function format(str: string, vars?: Record<string, string | number>) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const d = dicts[current] ?? pt;
  return format(d[key] ?? key, vars);
}

export function useLocale() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Hook so components re-render on locale change.
export function useT() {
  useLocale();
  return t;
}
