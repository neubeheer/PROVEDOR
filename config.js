/* Configuração online do Provedor Tycoon. Deixe em branco para jogar só no aparelho.

   supabaseUrl / supabaseAnonKey  → conta (login) e progresso salvo online.
     Supabase → botão Copy do projeto: "Project URL" e "Publishable key" (ou a antiga "anon public").
     A chave anon é pública por natureza; quem protege os dados são as regras do supabase/schema.sql.

   quadrasUrl → link do banco de quadras no Google Drive (o "App da Web" do Apps Script).
     Termina em /exec. Veja o README, seção "Banco de quadras no Google Drive". */
window.PT_CONFIG = {
  supabaseUrl: 'https://utwdnogihsfxxcuofoqi.supabase.co',
  supabaseAnonKey: 'sb_publishable_I-8kNZxqbjH8JBNTaZWPaA_8fF3SfMA',   // cole aqui a Publishable key (começa com sb_publishable_)
  quadrasUrl: 'https://script.google.com/macros/s/AKfycbzd_ehnhVIbY2qfxMyVK71w5tmbTUc6B3y_VS_Ales4Y4oD6dIlisj8UM1aDt7gYxfVOA/exec'
};
