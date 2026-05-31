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
  "search.ariaLabel": "Buscar atleta",
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
  "common.save": "Salvar",
  "common.cancel": "Cancelar",
  "common.delete": "Excluir",
  "common.edit": "Editar",
  "common.confirm": "Confirmar",
  "common.search": "Buscar",
  "common.actions": "Ações",
  "common.close": "Fechar",
  "common.send": "Enviar",
  "common.required": "Campo obrigatório",
  "common.optional": "opcional",

  // Painel — sidebar
  "panel.nav.dashboard": "Dashboard",
  "panel.nav.practitioners": "Praticantes",
  "panel.nav.newAchievement": "Nova Conquista",
  "panel.nav.credits": "Créditos",
  "panel.nav.support": "Suporte",
  "panel.nav.settings": "Configurações",
  "panel.nav.logout": "Sair",

  // Athlete portal — sidebar
  "athlete.nav.profile": "Meu perfil",
  "athlete.nav.graduations": "Minhas graduações",
  "athlete.nav.card": "Minha carteirinha",
  "athlete.nav.logout": "Sair",

  // Athlete — profile
  "athlete.profile.title": "Meu perfil",
  "athlete.profile.photo": "Foto de perfil",
  "athlete.profile.photo.upload": "Enviar foto",
  "athlete.profile.photo.tooLarge": "Imagem muito grande (máx 5MB).",
  "athlete.profile.photo.invalidType": "Formato inválido. Use JPG ou PNG.",
  "athlete.profile.photo.uploaded": "Foto atualizada.",
  "athlete.profile.field.firstName": "Nome",
  "athlete.profile.field.lastName": "Sobrenome",
  "athlete.profile.field.phone": "Telefone",
  "athlete.profile.field.email": "E-mail",
  "athlete.profile.field.cpf": "CPF",
  "athlete.profile.field.birth": "Data de nascimento",
  "athlete.profile.changeEmail": "Alterar e-mail",
  "athlete.profile.changeEmail.sent": "Enviamos um link de confirmação para {email}",
  "athlete.profile.locked": "Por segurança, este campo não pode ser alterado",
  "athlete.profile.saved": "Perfil atualizado.",

  // Athlete — graduations
  "athlete.grad.title": "Minhas graduações",
  "athlete.grad.viewPassport": "Ver meu passaporte público →",
  "athlete.grad.empty": "Nenhuma graduação registrada ainda.",
  "athlete.grad.col.date": "Data",
  "athlete.grad.col.belt": "Faixa",
  "athlete.grad.col.by": "Graduado por",
  "athlete.grad.col.hash": "Hash",
  "athlete.grad.copyHash": "Copiar hash",
  "athlete.grad.hashCopied": "Hash copiado.",

  // Athlete — card
  "athlete.card.title": "Minha carteirinha",
  "athlete.card.selectModality": "Selecione a modalidade",
  "athlete.card.issuedOn": "Emitida em {date}",
  "athlete.card.download": "Baixar carteirinha",
  "athlete.card.instruction": "Apresente esta carteirinha onde precisar. O QR Code leva ao seu passaporte completo.",
  "athlete.card.empty": "Você ainda não está vinculado a nenhuma organização.",

  // Painel — dashboard
  "dash.kpi.practitioners": "Total praticantes",
  "dash.kpi.certificates": "Certificados emitidos",
  "dash.kpi.credits": "Saldo de créditos",
  "dash.kpi.lastGrad": "Última graduação",
  "dash.credits.buyMore": "Comprar mais",
  "dash.credits.zero": "Você não tem créditos. Compre um pacote para registrar graduações.",
  "dash.charts.beltDist": "Distribuição por faixa",
  "dash.charts.achMonth": "Graduações por mês",
  "dash.charts.evolution": "Evolução de praticantes",
  "dash.recent.title": "Últimas conquistas",
  "dash.recent.empty": "Nenhuma conquista registrada ainda.",

  // Painel — praticantes
  "prac.title": "Praticantes",
  "prac.new": "Novo praticante",
  "prac.export": "Exportar CSV",
  "prac.import": "Importar CSV/XLSX",
  "prac.search.ph": "Buscar por nome…",
  "prac.filter.belt": "Faixa",
  "prac.filter.art": "Arte marcial",
  "prac.filter.clear": "Limpar filtros",
  "prac.col.name": "Nome",
  "prac.col.belt": "Graduação",
  "prac.col.actions": "Ações",
  "prac.action.viewPassport": "Ver passaporte",
  "prac.action.registerAchievement": "Registrar conquista",
  "prac.empty": "Nenhum praticante encontrado.",
  "prac.delete.confirm": "Tem certeza que deseja excluir este praticante?",
  "prac.delete.fkError": "Não é possível excluir: praticante possui conquistas registradas.",
  "prac.exp.date": "Data",
  "prac.exp.belt": "Faixa",
  "prac.exp.gradBy": "Graduado por",
  "prac.exp.hash": "Hash",
  "prac.exp.empty": "Sem conquistas.",

  // Novo / editar praticante
  "prac.form.title.new": "Novo praticante",
  "prac.form.title.edit": "Editar praticante",
  "prac.form.section.personal": "Dados pessoais",
  "prac.form.section.affil": "Filiação",
  "prac.form.section.art": "Arte marcial",
  "prac.form.cpf": "CPF",
  "prac.form.cpf.hint": "Usado apenas para evitar duplicatas — nunca exibido publicamente",
  "prac.form.cpf.verify": "Verificar",
  "prac.form.cpf.found": "Encontramos {name} com este CPF. Deseja vincular à sua escola?",
  "prac.form.cpf.linked": "Praticante vinculado com sucesso.",
  "prac.form.firstName": "Nome",
  "prac.form.lastName": "Sobrenome",
  "prac.form.birth": "Data de nascimento",
  "prac.form.gender": "Sexo",
  "prac.form.gender.M": "Masculino",
  "prac.form.gender.F": "Feminino",
  "prac.form.gender.O": "Outro",
  "prac.form.father": "Nome do pai",
  "prac.form.mother": "Nome da mãe",
  "prac.form.art": "Arte marcial",
  "prac.form.belt": "Faixa atual",
  "prac.form.submit.new": "Cadastrar praticante",
  "prac.form.submit.edit": "Salvar alterações",

  // Nova conquista
  "ach.title": "Nova conquista",
  "ach.banner.balance": "Você tem {n} crédito(s). Cada graduação consome 1.",
  "ach.banner.zero": "Você não tem créditos disponíveis.",
  "ach.field.athlete": "Praticante",
  "ach.field.athlete.ph": "Digite ao menos 3 letras…",
  "ach.field.modality": "Modalidade",
  "ach.field.belt": "Faixa",
  "ach.field.belt.basic": "Cores básicas",
  "ach.field.belt.black": "Faixa preta",
  "ach.field.date": "Data",
  "ach.field.gradBy": "Graduado por",
  "ach.field.notes": "Observações",
  "ach.preview.title": "Pré-visualização",
  "ach.suggestion": "Sugestão baseada no modelo {model}",
  "ach.confirm.title": "Confirmar graduação",
  "ach.confirm.body": "Esta ação consumirá 1 crédito.",
  "ach.success.title": "Conquista registrada!",
  "ach.success.hash": "Hash de verificação",
  "ach.success.copy": "Copiar hash",
  "ach.success.copied": "Hash copiado.",
  "ach.success.viewPass": "Ver passaporte",
  "ach.success.another": "Registrar outra",

  // Créditos
  "cred.title": "Créditos",
  "cred.balance": "Saldo atual",
  "cred.method": "Método de pagamento",
  "cred.buy": "Comprar",
  "cred.col.plan": "Plano",
  "cred.col.credits": "Créditos",
  "cred.col.price": "Preço",
  "cred.col.perGrad": "Por graduação",
  "cred.history.title": "Histórico de transações",
  "cred.history.date": "Data",
  "cred.history.type": "Tipo",
  "cred.history.amount": "Quantidade",
  "cred.history.status": "Status",
  "cred.history.use": "Uso de crédito",
  "cred.success": "Pagamento aprovado! Seus créditos foram adicionados.",
  "cred.pending": "Pagamento em processamento.",
  "cred.failure": "Pagamento não concluído.",

  // Configurações
  "cfg.title": "Configurações",
  "cfg.tab.school": "Escola",
  "cfg.tab.coach": "Head Coach",
  "cfg.tab.account": "Conta",
  "cfg.school.name": "Nome da escola",
  "cfg.school.art": "Arte marcial",
  "cfg.school.logo": "Logo (máx 2MB)",
  "cfg.school.city": "Cidade",
  "cfg.school.state": "Estado",
  "cfg.coach.name": "Nome",
  "cfg.coach.grad": "Graduação",
  "cfg.account.email": "E-mail",
  "cfg.account.changeEmail": "Alterar e-mail",
  "cfg.account.changePass": "Alterar senha",
  "cfg.account.newPass": "Nova senha",
  "cfg.account.confirmPass": "Confirmar senha",

  // Suporte
  "sup.title": "Suporte",
  "sup.new": "Novo Ticket",
  "sup.filter.all": "Todos",
  "sup.filter.open": "Abertos",
  "sup.filter.resolved": "Resolvidos",
  "sup.modal.subject": "Assunto",
  "sup.modal.category": "Categoria",
  "sup.modal.message": "Mensagem",
  "sup.modal.create": "Criar ticket",
  "sup.cat.bug": "Bug",
  "sup.cat.duvida": "Dúvida",
  "sup.cat.creditos": "Créditos",
  "sup.cat.cadastro": "Cadastro",
  "sup.cat.outro": "Outro",
  "sup.status.open": "Aberto",
  "sup.status.awaiting_admin": "Aguardando admin",
  "sup.status.awaiting_school": "Aguardando você",
  "sup.status.resolved": "Resolvido",
  "sup.status.closed": "Fechado",
  "sup.thread.empty": "Selecione um ticket para ver a conversa.",
  "sup.thread.reply": "Escreva sua resposta…",
  "sup.thread.send": "Enviar",
  "sup.list.empty": "Nenhum ticket por aqui.",

  // Dash — sidebar
  "dash.nav.dashboard": "Dashboard",
  "dash.nav.orgs": "Organizações",
  "dash.nav.athletes": "Atletas",
  "dash.nav.graduations": "Graduações",
  "dash.nav.models": "Modelos de Graduação",
  "dash.nav.finance": "Financeiro",
  "dash.nav.support": "Suporte",
  "dash.nav.contacts": "Contatos",
  "dash.nav.audit": "Auditoria",
  "dash.nav.logout": "Sair",

  // Dash — common
  "dash.period.today": "Hoje",
  "dash.period.7d": "7 dias",
  "dash.period.30d": "30 dias",
  "dash.period.month": "Mês atual",
  "dash.period.year": "Ano atual",
  "dash.period.custom": "Personalizado",
  "dash.export.csv": "Exportar CSV",
  "dash.export.pdf": "Exportar PDF",
  "dash.export.xlsx": "Exportar XLSX",
  "dash.empty": "Nada por aqui ainda.",
  "dash.search.ph": "Buscar…",
  "dash.filters": "Filtros",
  "dash.filters.clear": "Limpar",
  "dash.actions": "Ações",

  // Dash — overview
  "dash.title": "Dashboard",
  "dash.kpi.orgs": "Organizações",
  "dash.kpi.athletes": "Atletas",
  "dash.kpi.achievements": "Conquistas (mês)",
  "dash.kpi.revenue": "Receita (mês)",
  "dash.chart.growth": "Crescimento mensal",
  "dash.chart.revenue": "Receita mensal",
  "dash.recent.schools": "Organizações recentes (7d)",
  "dash.zero.schools": "Organizações sem créditos",

  // Dash — orgs
  "dash.orgs.title": "Organizações",
  "dash.orgs.col.name": "Nome",
  "dash.orgs.col.city": "Cidade",
  "dash.orgs.col.art": "Modalidade",
  "dash.orgs.col.status": "Status",
  "dash.orgs.col.credits": "Créditos",
  "dash.orgs.col.created": "Criada em",
  "dash.orgs.status.active": "Ativa",
  "dash.orgs.status.suspended": "Suspensa",
  "dash.orgs.filter.art": "Modalidade",
  "dash.orgs.filter.state": "Estado",
  "dash.orgs.filter.status": "Status",
  "dash.orgs.filter.credits": "Créditos",
  "dash.orgs.filter.withCredits": "Com créditos",
  "dash.orgs.filter.noCredits": "Sem créditos",
  "dash.orgs.action.suspend": "Suspender",
  "dash.orgs.action.reactivate": "Reativar",
  "dash.orgs.action.grant": "Conceder créditos",
  "dash.orgs.suspend.reason": "Motivo da suspensão",
  "dash.orgs.grant.amount": "Quantidade",
  "dash.orgs.grant.reason": "Motivo",
  "dash.orgs.tab.athletes": "Atletas",
  "dash.orgs.tab.grads": "Graduações",
  "dash.orgs.tab.tickets": "Tickets",
  "dash.orgs.tab.transactions": "Transações",
  "dash.orgs.tab.audit": "Auditoria",
  "dash.orgs.tab.school_audit": "Ações da escola",

  // Dash — athletes
  "dash.ath.title": "Atletas",
  "dash.ath.col.name": "Nome",
  "dash.ath.col.fpid": "FP-ID",
  "dash.ath.col.cpf": "CPF",
  "dash.ath.col.schools": "Organizações",
  "dash.ath.col.achievements": "Conquistas",
  "dash.ath.reveal.cpf": "Revelar CPF",
  "dash.ath.reveal.birth": "Revelar data",
  "dash.ath.edit": "Editar atleta",
  "dash.ath.edit.reason": "Motivo da alteração (obrigatório)",

  // Dash — graduations
  "dash.grad.title": "Graduações",
  "dash.grad.col.date": "Data",
  "dash.grad.col.athlete": "Atleta",
  "dash.grad.col.school": "Escola",
  "dash.grad.col.modality": "Modalidade",
  "dash.grad.col.belt": "Faixa",
  "dash.grad.col.by": "Graduado por",
  "dash.grad.col.hash": "Hash",

  // Dash — belt models
  "dash.mod.title": "Modelos de Graduação",
  "dash.mod.new": "Novo modelo",
  "dash.mod.edit": "Editar modelo",
  "dash.mod.col.name": "Nome",
  "dash.mod.col.modality": "Modalidade",
  "dash.mod.col.federation": "Federação",
  "dash.mod.col.belts": "Faixas",
  "dash.mod.col.default": "Padrão",
  "dash.mod.col.status": "Status",
  "dash.mod.form.name": "Nome do modelo",
  "dash.mod.form.modality": "Modalidade",
  "dash.mod.form.federation": "Federação (opcional)",
  "dash.mod.form.belts": "Sequência de faixas",
  "dash.mod.form.addBelt": "Adicionar faixa",
  "dash.mod.form.beltLabel": "Nome da faixa",
  "dash.mod.form.default": "Usar como padrão para esta modalidade",
  "dash.mod.action.setDefault": "Definir como padrão",
  "dash.mod.action.activate": "Ativar",
  "dash.mod.action.deactivate": "Desativar",

  // Dash — finance
  "dash.fin.title": "Financeiro",
  "dash.fin.kpi.revenue": "Receita",
  "dash.fin.kpi.transactions": "Transações",
  "dash.fin.kpi.avgTicket": "Ticket médio",
  "dash.fin.kpi.schools": "Escolas únicas",
  "dash.fin.kpi.mrr": "MRR",
  "dash.fin.kpi.ltv": "LTV",
  "dash.fin.kpi.repurchase": "Recompra",
  "dash.fin.kpi.buyers": "Compradores",
  "dash.fin.kpi.repeatBuyers": "Recorrentes",
  "dash.fin.kpi.avgPurchases": "Compras médias",
  "dash.fin.chart.monthly": "Receita mensal",
  "dash.fin.chart.byPackage": "Receita por pacote",
  "dash.fin.chart.topSchools": "Top escolas por receita",

  // Dash — support
  "dash.sup.title": "Suporte",
  "dash.sup.tab.open": "Abertos",
  "dash.sup.tab.awaiting": "Aguardando escola",
  "dash.sup.tab.resolved": "Resolvidos",
  "dash.sup.tab.all": "Todos",
  "dash.sup.resolve": "Marcar como resolvido",
  "dash.sup.reply.ph": "Responder…",

  // Dash — contacts
  "dash.contacts.title": "Contatos",
  "dash.contacts.col.date": "Data",
  "dash.contacts.col.name": "Nome",
  "dash.contacts.col.email": "E-mail",
  "dash.contacts.col.subject": "Assunto",
  "dash.contacts.col.status": "Status",
  "dash.contacts.action.read": "Marcar como lido",
  "dash.contacts.action.archive": "Arquivar",

  // Dash — audit
  "dash.audit.title": "Auditoria",
  "dash.audit.col.when": "Quando",
  "dash.audit.col.admin": "Admin",
  "dash.audit.col.action": "Ação",
  "dash.audit.col.target": "Alvo",
  "dash.audit.col.meta": "Detalhes",
  "dash.audit.action.school.suspend": "Suspendeu organização",
  "dash.audit.action.school.reactivate": "Reativou organização",
  "dash.audit.action.school.grant_bonus": "Concedeu créditos de cortesia",
  "dash.audit.action.person.update": "Editou atleta",
  "dash.audit.action.reveal_cpf": "Revelou CPF",
  "dash.audit.action.reveal_birth_date": "Revelou data de nascimento",
  "dash.audit.action.belt_model.create": "Criou modelo de graduação",
  "dash.audit.action.belt_model.update": "Atualizou modelo de graduação",
  "dash.audit.action.belt_model.deactivate": "Desativou modelo de graduação",
};

// en-US and es-ES use pt-BR as the UI baseline; belt labels are handled separately by beltLabels.ts.
const dicts: Record<string, Dict> = { "pt-BR": pt, "en-US": pt, "es-ES": pt };

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
