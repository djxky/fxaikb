(function(){
  const page = document.body.dataset.page;
  const routeMap = {
    default: '02-workbench.html',
    empty: '01-empty-onboarding.html',
    'onboarding-scan': '01-empty-onboarding.html',
    'onboarding-progress': '01-empty-onboarding.html',
    source: '03-file-preview.html',
    qbank: '04-qbank.html',
    'qbank-empty': '04-qbank.html',
    'recent-chat-view': '05-recent-chat.html',
    welcome: '06-welcome-guide.html',
    'welcome-doc': '06-welcome-guide.html'
  };

  const originalSetState = window.setState;
  window.setState = function(state){
    if(document.querySelector(`.state[data-state="${state}"]`)){
      originalSetState(state);
      return;
    }
    const target = routeMap[state];
    if(target) window.location.href = target;
  };

  window.navToKnowledgeBase = function(){
    window.location.href = '02-workbench.html';
  };

  window.navToQBank = function(subj){
    const suffix = subj ? `?subj=${encodeURIComponent(subj)}` : '';
    window.location.href = '04-qbank.html' + suffix;
  };

  window.openUploadWindow = function(){
    window.location.href = '07-upload.html';
  };

  if(page === 'welcome-guide'){
    window.openImportDrawer = function(){
      window.location.href = '01-empty-onboarding.html';
    };
  }

  if(page !== 'file-preview'){
    window.openSource = function(name){
      const suffix = name ? `?source=${encodeURIComponent(name)}` : '';
      window.location.href = '03-file-preview.html' + suffix;
    };
  }

  if(page !== 'recent-chat' && page !== 'welcome-guide'){
    window.openRecentChat = function(chatId){
      const suffix = chatId ? `?chat=${encodeURIComponent(chatId)}` : '';
      window.location.href = '05-recent-chat.html' + suffix;
    };
  }

  if(page !== 'welcome-guide'){
    window.openWelcomeDoc = function(){
      window.location.href = '06-welcome-guide.html';
    };
  }

  document.addEventListener('DOMContentLoaded', function(){
    if(window.lucide) lucide.createIcons();
  });
})();
