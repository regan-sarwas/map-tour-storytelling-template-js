define(["storymaps/ui/inlineFieldEdit/InlineFieldEdit",
		"storymaps/utils/Helper",
		"dojo/has",
		"dojo/topic",
		"esri/urlUtils",
		"./units"
	],
	function(
		InlineFieldEdit,
		Helper,
		has,
		topic,
		urlUtils,
		units
	){
		/**
		 * Header
		 * @class Header
		 *
		 * UI Header component
		 *  - Mobile and desktop title/subtitle doesn't share the same div
		 *  - So title and subtile are set twice and edits in desktop are reported to the mobile
		 */
		return function Header(selector, isInBuilderMode)
		{
			var _builderButtonHidden = false;
			var _bitlyStartIndexStatus = '';

			this.init = function(hideDesktop, title, subtitle, bgColor, logoURL, logoTarget, displaySwitchBuilderButton, topLinkText, topLinkURL, social)
			{
				this.setColor(bgColor);
				this.setLogoInfo(logoURL, logoTarget);

				if( hideDesktop )
					$(selector).addClass('hideDesktop');

				// Mobile
				$(selector + ' #headerMobile .title')
					.html(title)
					.find('a:not([target])').attr('target', '_blank');
				$(selector + ' #headerMobile .subtitle')
					.html(subtitle)
					.find('a:not([target])').attr('target', '_blank');

				// Desktop builder
				if( isInBuilderMode ) {
					$(selector).addClass('isBuilder');
					title =  "<div class='text_edit_label'>" + (title || i18n.viewer.headerJS.editMe) + "</div>";
					if ( $("body").hasClass("side-panel") ) {
						title +=  "<div class='text_edit_icon pencilIconDiv'><i class='fa fa-pencil' title='"+i18n.viewer.headerJS.templateTitle+"'></i></div>";
					}else {
						title +=  "<div class='text_edit_icon'><i class='fa fa-pencil' title='"+i18n.viewer.headerJS.templateTitle+"'></i></div>";
					}
					title += "<textarea rows='1' class='text_edit_input' type='text' spellcheck='true'></textarea>";

					subtitle =  "<span class='text_edit_label'>" + (subtitle || i18n.viewer.headerJS.editMe) + "</span>";
					subtitle += "<div class='text_edit_icon' title='"+i18n.viewer.headerJS.templateSubtitle+"'></div>";
					subtitle += "<textarea rows='2' class='text_edit_input' type='text' spellcheck='true'></textarea>";
				}

				$(selector + ' #headerDesktop .title')
					.html(title)
					.find('a:not([target])').attr('target', '_blank');
				$(selector + ' #headerDesktop .subtitle')
					.html(subtitle)
					.find('a:not([target])').attr('target', '_blank');

				if( $('body').hasClass('side-panel') ) {
					$("#headerDesktop").prepend($(".logo"));
				}

				// Desktop builder
				if( isInBuilderMode ){
					new InlineFieldEdit(selector, editFieldsEnterEvent, editFieldsExitEvent);
				}

				//if( ! isInBuilderMode && ! subtitle  && !$("body").hasClass("side-panel") {
				//	$(selector + ' #headerDesktop .title').css("margin-top", 40);
				//	$(selector + ' #headerDesktop .subtitle').css("height", 32);
				//}

				// Mobile init
				$(window).scroll(this.hideMobileBanner);
				$(selector + " #headerMobile .banner").fastClick(this.hideMobileBanner);
				$(selector + " #openHeaderMobile").fastClick(showMobileHeader);

				// Navigation bar
				$(".navBar span").fastClick(function(){
					if( ! $(this).hasClass("current") )
						location.hash = $(this).data("viewid");
				});

				if ( displaySwitchBuilderButton ) {
					$(selector + " .fa-cog, .editLabel").fastClick(this.switchToBuilder);
					$("#header .editLabel").fastClick(this.switchToBuilder);
					$(selector + " .switch-builder-close").click(this.closeEditButton);
					$(selector + " .switchBuilder").show();
				}

				showMobileHeader(true);
				this.setTopRightLink(topLinkText, topLinkURL);
				this.setSocial(social, true);

				$(selector).css("display", "block");

				app.requestBitly = requestBitly;
			};

			this.resize = function(widthViewport)
			{
				if($("body").hasClass("side-panel")){
					$('.textArea').css('left', $('.logo img').width() + 10);
					$('.textArea').width(widthViewport - $('.logo img').width() - $('.rightArea').outerWidth() - (app.data.userIsAppOwner() ? 45 : 15));
				} else {
					var rightAreaWidth = Math.max($(selector + " #headerDesktop .headerLogoImg").outerWidth() + 50, $(selector + " #headerDesktop .rightArea").outerWidth() + 20);
					$(selector + " #headerDesktop .textArea").width(widthViewport - rightAreaWidth - 15);
				}

			};

			this.hideMobileBanner = function(immediate)
			{
				$(selector + " #headerMobile .banner").slideUp(immediate === true ? 0 : 250);
				$(selector + " #openHeaderMobile").css("top", "40px");
				$(selector + " #headerMobile").removeClass("firstDisplay");
			};

			this.mobileHeaderIsInFirstState = function()
			{
				return $(selector + " #headerMobile").hasClass("firstDisplay");
			};

			this.setColor = function(bgColor)
			{
				$(selector).css("background-color", bgColor);
				$(selector).css("background-color", bgColor);
				$(selector + " #builderPanel").css("background-color", bgColor);
				$(selector + ' #headerMobile').css("background-color", bgColor);
				$("#openHeaderMobile").css("background-color", bgColor);
			};

			this.setLogoInfo = function(url, target)
			{
				console.log(url,target);
				if ( ! url || url == "NO_LOGO" ) {
					$(selector + ' .logo img').hide();
				}
				else {
					if( $("body").hasClass("side-panel") ) {
						var imgCheck = new Image();
						imgCheck.onload = function(){
							$('.logo img').css("display") == "block" ? $(".textArea").css("left", $('.logo img').width() + 12) : $(".textArea").css("left", $('.logo').width() + 12);
						};
						imgCheck.src = url;
					}
					$(selector + ' .logo img').attr("src", url);
					// Again for mobile scroll layout
					$('.scroll-layout-banner .mobile-scroll-logo').attr("src", url);
					if (target) {
						$(selector + ' .logo img').closest("a")
							.css("cursor", "pointer")
							.attr("href", target);
						// Again for mobile scroll layout
						$('.scroll-layout-banner .mobile-scroll-logo-link')
							.css("cursor", "pointer")
							.attr("href", target);
					}
					else
						$(selector + ' .logo img').closest("a").css("cursor", "default");
						// Again for mobile scroll layout
						$('.scroll-layout-banner .mobile-scroll-logoLink').css("cursor", "default");

					$(selector + ' .logo img').show();
				}
			};

			this.setTopRightLink = function(text, link)
			{
				if( link ) {
					$(selector + ' .organization .unit').html(text ? '<a href="' + link + '" target="_blank">' + text + '</a>' : '');
					$('.scroll-layout-banner .mobile-scroll-story-tag-link').attr('href', link).html(text || '');
				} else if ( text ) {
					$(selector + ' .organization .unit').html(text);
					$('.scroll-layout-banner .mobile-scroll-story-tag-link').html(text);
				} else
					$(selector + ' .organization .unit').html('');
				setNPSBanner(text, link);
			};

			function setNPSBanner(unitcode, link)
			{
					if (unitcode in units) {
							if (link) {
									$("#parkShortName").html('<a href="'+link + '" target="blank">' + units[unitcode].name + '</a>');
							} else {
									$("#parkShortName").html(units[unitcode].name);
							}
							$("#unitType").html(units[unitcode].type);
							$("#parkLocation").html(units[unitcode].state);
					} else {
							var headerparts = unitcode.split("|");
							if (link) {
									$("#parkShortName").html('<a href="'+link + '" target="blank">' + headerparts[0] + '</a>');
							} else {
									$("#parkShortName").html(headerparts[0]);
							}
							if (headerparts.length > 1) {
									$("#unitType").html(headerparts[1]);
							}
							if (headerparts.length > 2) {
									$("#parkLocation").html(headerparts[2]);
							}
					}
			}

			this.setTitleAndSubtitle = function(title, subtitle)
			{
				$(selector + ' #headerMobile .title').html(title);
				$(selector + ' #headerMobile .subtitle').html(subtitle);

				var defaultText = isInBuilderMode ? i18n.viewer.headerJS.editMe : '';

				$(selector + ' #headerDesktop .title' + (isInBuilderMode ? ' .text_edit_label' : '')).html(title || defaultText);
				$(selector + ' #headerDesktop .subtitle' + (isInBuilderMode ? ' .text_edit_label' : '')).html(subtitle || defaultText);
			};

			this.setSocial = function(social, initialCfg)
			{
				$(selector + " .share_facebook").toggle(
					APPCFG.HEADER_SOCIAL
					&& APPCFG.HEADER_SOCIAL.facebook
					&& (!social || social.facebook)
				);

				$(selector + " .share_twitter").toggle(
					APPCFG.HEADER_SOCIAL
					&& APPCFG.HEADER_SOCIAL.twitter
					&& (!social || social.twitter)
				);

				$(selector + " .share_bitly").toggle(
					APPCFG.HEADER_SOCIAL && APPCFG.HEADER_SOCIAL.bitly
					&& APPCFG.HEADER_SOCIAL.bitly.enable && APPCFG.HEADER_SOCIAL.bitly.login
					&& APPCFG.HEADER_SOCIAL.bitly.key && (!social || social.bitly)
				);

				if( initialCfg ) {
					$(selector + " .share_facebook").unbind('click');
					$(selector + " .share_twitter").unbind('click');
					$(selector + " .share_bitly").unbind('click');

					$(selector + " .share_facebook").fastClick(shareFacebook);
					$(selector + " .share_twitter").fastClick(shareTwitter);
					$(selector + " .share_bitly").fastClick(shareBitly);

					// Bind keyboard enter to click
					$(selector).find(".shareIcon").off('keypress').keypress(function (e) {
						if(e.which == 13) {
							$(this).click();
							return false;
						}
					});

				}
			};

			this.enableAutoplay = function()
			{
				$(selector + " .shareIcon").attr("title", "");

				$(selector + " .shareIcon")
					.toggleClass("disabled", true)
					.popover({
						trigger: 'hover',
						content: '<div style="font-size: 12px">' + i18n.viewer.desktopHTML.tooltipAutoplayDisabled + '</div>',
						placement: 'bottom',
						html: true
					});
			};

			function shareFacebook()
			{
				var url = cleanURL(document.location.href);

				if ( $(this).hasClass("disabled") ) {
					return;
				}

				window.open(
					'http://www.facebook.com/sharer/sharer.php?u=' + url,
					'',
					'toolbar=0,status=0,width=626,height=436'
				);
			}

			function shareTwitter()
			{
				var options = 'text=' + encodeURIComponent($(selector + ' #headerMobile .title').text())
								+ '&url=' + cleanURL(document.location.href)
								+ '&related=EsriStoryMaps'
								+ '&hashtags=StoryMaps';

				if ( $(this).hasClass("disabled") ) {
					return;
				}

				window.open(
					'https://twitter.com/intent/tweet?' + options,
					'',
					'toolbar=0,status=0,width=626,height=436'
				);
			}

			function shareBitly()
			{
				if ( $(this).hasClass("disabled") ) {
					return;
				}

				$(selector).find(".share_bitly").popover({
					trigger: 'manual',
					placement: 'left',
					html: true,
					content:
						'<div style="width:150px; min-height: 60px; text-align: center">'
						+ ' <div id="bitlyLoad" style="position:absolute; top: 16px; left: 24px; width:130px; text-align:center;">'
						+ '  <img src="resources/icons/loader-upload.gif" alt="Loading" />'
						+ ' </div>'
						+ ' <input id="bitlyInput" type="text" value="" style="display:none; width: 130px; margin-bottom: 0px;"/>'
						+ ' <div style="font-size: 0.8em; margin-top: 2px; margin-bottom: -1px; position: absolute; top: 40px; width: 100%; left: 0px; text-align: center;">'
						+ '  <input id="bitlyStartIndex" type="checkbox" style="width: 10px; vertical-align: -2px;" ' + _bitlyStartIndexStatus + '/> '
						+    i18n.viewer.desktopHTML.bitlyStartIndex
						+ ' </div>'
						+ ' <div class="autoplay-container" style="font-size: 0.8em; margin-top: 2px; margin-bottom: -1px; position: absolute; top: 57px; width: 100%; left: 0px; text-align: center;">'
						+ '   <input type="checkbox" class="autoplay-checkbox" value="autoplay" style="width: 10px; vertical-align: -2px;" /> '
						+    i18n.viewer.desktopHTML.autoplayLabel
						+ '  <a class="autoplay-help"><img src="resources/icons/builder-help.png" style="vertical-align: -4px;"/></a>'
						+ ' </div>'
						+ '</div>'
						+ '<script>'
						+ ' $(document).on("click touchstart", function(src) { if( ! src || ! src.target || ! $(src.target).parents(".popover").length ){ $(".share_bitly").popover("hide"); $(document).off("click"); } });'
						+ ' $("#bitlyStartIndex").change(app.requestBitly); '
						+ '</script>'
				}).popover('toggle');

				$(selector).find(".autoplay-help").popover({
					content: "<div style='width: 150px'>"
						+ i18n.viewer.desktopHTML.autoplayExplain1
						+ "<br /><br />"
						+ i18n.viewer.desktopHTML.autoplayExplain2,
					placement: 'bottom',
					html: true
				});

				$(selector).find('.autoplay-checkbox').change(requestBitly);

				requestBitly();
			}

			function requestBitly()
			{
				var bitlyUrl = 'https://arcg.is/prod/shorten?callback=?';

				var urlParams = Helper.getUrlParams();
				var currentIndex = app.data.getCurrentIndex() + 1;
				var targetUrl = document.location.href;

				if( $("#bitlyStartIndex").is(":checked") ) {
					if( urlParams.index )
						targetUrl = targetUrl.replace(/index\=[0-9]+/, 'index=' + currentIndex);
					else
						targetUrl = document.location.origin
									+ document.location.pathname
									+ (!urlParams || $.isEmptyObject(urlParams) ? '?' : document.location.search + '&')
									+ 'index=' + currentIndex
									+ document.location.hash;
				}

				targetUrl = cleanURL(targetUrl, true);

				// Autoplay
				if( $(".autoplay-checkbox").is(":checked") ) {
					targetUrl += targetUrl.match(/\?/) ? '&' : '?';
					targetUrl += 'autoplay';
				}

				//else {
					// remove index parameter if any
					//targetUrl = targetUrl.replace(/index\=[0-9]+/, '');
				//}

				_bitlyStartIndexStatus = $("#bitlyStartIndex").is(":checked") ? 'checked' : '';

				$.getJSON(
					bitlyUrl,
					{
						"format": "json",
						"apiKey": APPCFG.HEADER_SOCIAL.bitly.key,
						"login": APPCFG.HEADER_SOCIAL.bitly.login,
						"longUrl": targetUrl
					},
					function(response)
					{
						if( ! response || ! response || ! response.data.url )
							return;

						$("#bitlyLoad").fadeOut();
						$("#bitlyInput").fadeIn();
						$("#bitlyInput").val(response.data.url);
						$("#bitlyInput").select();
					}
				);
			}

			function cleanURL(url, noEncoding)
			{
				var urlParams = urlUtils.urlToObject(url);
				var newUrl = urlParams.path;

				if ( urlParams.query ) {
					delete urlParams.query.edit;
					delete urlParams.query.locale;
					delete urlParams.query.folderId;
					delete urlParams.query.webmap;
					delete urlParams.query.autoplay;

					$.each(Object.keys(urlParams.query), function(i, k){
						if ( i === 0 ){
							newUrl += '?';
						}
						else {
							newUrl += '&';
						}

						if ( urlParams.query[k] !== undefined && urlParams.query[k] !== "" ) {
							newUrl += k + '=' + urlParams.query[k];
						}
						else {
							newUrl += k;
						}
					});
				}

				return noEncoding ? newUrl : encodeURIComponent(newUrl);
			}

			function showMobileHeader(immediate)
			{
				$(selector + " #headerMobile .banner").slideDown(immediate === true ? 0 : 250);
			}

			function editFieldsEnterEvent()
			{
				if( ! _builderButtonHidden )
					$(selector + " #builderPanel").fadeOut("fast");
				_builderButtonHidden = false;
			}

			function editFieldsExitEvent(src, value)
			{
				_builderButtonHidden = true;
				setTimeout(function(){
					if( _builderButtonHidden )
						$(selector + " #builderPanel").fadeIn("fast");
					_builderButtonHidden = false;
				}, has("ios") || has("ie") >= 10 ? 500 : 100);

				setTimeout(function(){
					topic.publish("HEADER_EDITED", {
						src: $(src).attr("class"),
						value: value
					});
					$(selector + ' #headerMobile .banner .' + $(src).attr("class")).html(value);
				}, has("ios") || has("ie") >= 10 ? 700 : 0);

				app.builder.hideSaveConfirmation();
			}

			this.closeEditButton = function()
			{
				$(".switchBuilder").hide();
			};

			this.switchToBuilder = function()
			{
				if( document.location.search.match(/appid/) )
					document.location = cleanURL(document.location.protocol + '//' + document.location.host + document.location.pathname + document.location.search, true) + "&edit" + document.location.hash;
				else if ( document.location.search.slice(-1) == '?' )
					document.location = cleanURL(document.location.protocol + '//' + document.location.host + document.location.pathname, true) + "?edit"  + document.location.hash;
				else
					document.location = cleanURL(document.location.protocol + '//' + document.location.host + document.location.pathname, true) + "?edit"  + document.location.hash;
			};

			this.initLocalization = function()
			{
				//Mobile
				$(selector + ' #closeHeaderMobile').html(i18n.viewer.mobileHTML.hideIntro);
				$(selector + ' #openHeaderMobile').html(i18n.viewer.mobileHTML.showIntro);
				$(selector + ' #listViewLink').html(i18n.viewer.mobileHTML.navList);
				$(selector + ' #mapViewLink').html(i18n.viewer.mobileHTML.navMap);
				$(selector + ' #infoViewLink').html(i18n.viewer.mobileHTML.navInfo);
				//Desktop
				$(selector + ' .msLink').html(i18n.viewer.desktopHTML.storymapsText);
				$(selector + ' .switchBuilder .editLabel').text(i18n.viewer.headerJS.edit);
				//$(selector + ' .switchBuilder').html('<div><img src="resources/icons/builder-edit-fields.png" /></div>' + i18n.viewer.desktopHTML.builderButton);
				$(selector + ' .share_facebook').attr("title", i18n.viewer.desktopHTML.facebookTooltip);
				$(selector + ' .share_twitter').attr("title", i18n.viewer.desktopHTML.twitterTooltip);
				$(selector + ' .share_bitly').attr("title", i18n.viewer.desktopHTML.bitlyTooltip);
			};
		};
	}
);
