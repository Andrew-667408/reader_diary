patterns:
    $AnyText = $nonEmptyGarbage
    $ThoughtTrigger = (мысль|мысли|заметку|мнение|впечатление)
    $QuoteTrigger = (цитату|цитата|цитаты|цитирую|цитировал)
    $SummaryTrigger = (вывод|выводы|итог|итоги|резюме|заключение)
    $ReadingTrigger = (читаю|читаемые|текущие)
    $FinishedTrigger = (прочитал|прочитанные|дочитал|завершённые)
    $WishlistTrigger = (вишлист|отложенные)
    $RatingOne = (один|одну|единица|1)
    $RatingTwo = (два|две|двойку|2)
    $RatingThree = (три|тройку|3)
    $RatingFour = (четыре|четвёрку|четверку|4)
    $RatingFive = (пять|пятёрку|пятерку|5)

theme: /

    # ────────────────────────────────────────────
    # СТАРТОВОЕ ПРИВЕТСТВИЕ
    # ────────────────────────────────────────────
    state: Start
        q!: (запусти|открой|запустить|открыть) $AnyText::appName
        q!: (запусти|открой|запустить|открыть)
        q!: (привет|здравствуй|начни|старт|поехали)
        a: Голосовой читательский дневник готов к работе. Скажите «добавь книгу», «что я сейчас читаю» или «покажи статистику».

    # ────────────────────────────────────────────
    # ДОБАВИТЬ КНИГУ
    # ────────────────────────────────────────────
    state: AddBook
        q!: (добавь|добавить|запиши|создай|занеси) книгу $AnyText::bookInfo
        q!: (добавь|добавить|занеси) книжку $AnyText::bookInfo
        q!: (хочу добавить|хочу записать) книгу $AnyText::bookInfo
        q!: новая книга $AnyText::bookInfo
        q!: (добавь|добавить|создай|новая) книгу
        q!: добавить книжку
        script:
            var raw = $parseTree._bookInfo || "";
            var numMap = {"сто":100,"двести":200,"триста":300,"четыреста":400,"пятьсот":500,"шестьсот":600,"семьсот":700,"восемьсот":800,"девятьсот":900,"тысяча":1000,"тысячи":1000};
            var numKeys = Object.keys(numMap).join("|");
            var re = new RegExp("^(.*?)\\s+(\\d+|" + numKeys + ")\\s*(страниц|страницы|страницу|стр)\\.?\\s*$", "i");
            var m = raw.match(re);
            var title = m ? m[1].trim() : raw.trim();
            var pages = null;
            if (m) { pages = parseInt(m[2]) || numMap[m[2].toLowerCase()] || null; }
            var params = { title: title };
            if (pages) params.pages = pages;
            var cmd = { type: "smart_app_data", action: { action_id: "add_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Открываю форму добавления книги «{{$parseTree._bookInfo}}»

    # ────────────────────────────────────────────
    # НАЧАТЬ ЧИТАТЬ
    # ────────────────────────────────────────────
    state: StartReading
        q!: начал читать $AnyText::bookTitle
        q!: я начал читать $AnyText::bookTitle
        q!: начать читать $AnyText::bookTitle
        q!: начни читать $AnyText::bookTitle
        q!: начинаю читать $AnyText::bookTitle
        q!: хочу начать читать $AnyText::bookTitle
        q!: берусь за $AnyText::bookTitle
        q!: приступил к чтению $AnyText::bookTitle
        q!: приступаю к чтению $AnyText::bookTitle
        q!: возобновить чтение $AnyText::bookTitle
        q!: продолжаю читать $AnyText::bookTitle
        q!: продолжить читать $AnyText::bookTitle
        q!: перенеси в читаемые $AnyText::bookTitle
        q!: переведи в статус читаю $AnyText::bookTitle
        q!: читаю сейчас $AnyText::bookTitle
        q!: начать читать
        q!: начни читать
        q!: хочу читать
        q!: начну читать
        q!: приступить к чтению
        q!: читать эту книгу
        script:
            var title = $parseTree._bookTitle || "";
            var cmd = { type: "smart_app_data", action: { action_id: "start_reading", parameters: { title: title } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Начинаю читать

    # ────────────────────────────────────────────
    # ДОБАВИТЬ МЫСЛЬ
    # ────────────────────────────────────────────
    state: AddThought
        q!: (запиши|добавь|сохрани|зафиксируй) $ThoughtTrigger $AnyText::noteText
        q!: хочу записать $AnyText::noteText
        q!: запомни $AnyText::noteText
        q!: отметь $AnyText::noteText
        q!: мысль такая $AnyText::noteText
        q!: мысль следующая $AnyText::noteText
        script:
            var text = $parseTree._noteText;
            var cmd = { type: "smart_app_data", action: { action_id: "add_note", parameters: { content: text, type: "thought" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Записал мысль

    # ────────────────────────────────────────────
    # ДОБАВИТЬ ЦИТАТУ
    # ────────────────────────────────────────────
    state: AddQuote
        q!: (запиши|добавь|сохрани|зафиксируй) $QuoteTrigger $AnyText::noteText
        q!: цитата такая $AnyText::noteText
        q!: цитата следующая $AnyText::noteText
        q!: цитата из книги $AnyText::noteText
        q!: автор говорит $AnyText::noteText
        q!: автор написал $AnyText::noteText
        q!: герой сказал $AnyText::noteText
        script:
            var text = $parseTree._noteText;
            var cmd = { type: "smart_app_data", action: { action_id: "add_note", parameters: { content: text, type: "quote" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Записал цитату

    # ────────────────────────────────────────────
    # ДОБАВИТЬ ВЫВОД
    # ────────────────────────────────────────────
    state: AddSummary
        q!: (запиши|добавь|сохрани|зафиксируй) $SummaryTrigger $AnyText::noteText
        q!: вывод такой $AnyText::noteText
        q!: вывод следующий $AnyText::noteText
        q!: вывод по книге $AnyText::noteText
        q!: подводя итог $AnyText::noteText
        q!: в итоге $AnyText::noteText
        script:
            var text = $parseTree._noteText;
            var cmd = { type: "smart_app_data", action: { action_id: "add_note", parameters: { content: text, type: "summary" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Записал вывод

    # ────────────────────────────────────────────
    # ДОЧИТАЛ
    # ────────────────────────────────────────────
    state: FinishBook
        q!: (дочитал|дочитала|закончил|закончила|прочитал|прочитала) книгу $AnyText::bookTitle
        q!: (дочитал|дочитала|закончил|закончила|прочитал|прочитала) $AnyText::bookTitle
        q!: я (дочитал|дочитала|закончил|закончила|прочитал|прочитала) $AnyText::bookTitle
        q!: (дочитал|дочитала|закончил|закончила|прочитал|прочитала) книгу
        q!: (дочитал|дочитала|закончил|закончила|прочитал|прочитала)
        q!: отметь книгу как прочитанную
        q!: пометь как прочитанную
        q!: переведи в прочитанные
        q!: переведи в прочитанные $AnyText::bookTitle
        q!: переведи в статус прочитано
        q!: книга прочитана
        q!: книга закончена
        q!: книга дочитана
        q!: завершил чтение
        q!: завершила чтение
        q!: закончил книгу $AnyText::bookTitle
        q!: закончила книгу $AnyText::bookTitle
        q!: я дочитал
        q!: я дочитала
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { title: title } : {};
            var cmd = { type: "smart_app_data", action: { action_id: "finish_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Отмечаю книгу как прочитанную

    # ────────────────────────────────────────────
    # ОЦЕНИТЬ КНИГУ
    # ────────────────────────────────────────────
    state: RateBookOne
        q!: (поставь|ставлю|оценка) $RatingOne $AnyText::bookTitle
        q!: (поставь|ставлю|оценка) $RatingOne
        q!: (поставь|ставлю) $RatingOne звезду
        q!: плохая книга
        q!: ужасная книга
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { rating: 1, title: title } : { rating: 1 };
            var cmd = { type: "smart_app_data", action: { action_id: "rate_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Поставил оценку 1

    state: RateBookTwo
        q!: (поставь|ставлю|оценка) $RatingTwo $AnyText::bookTitle
        q!: (поставь|ставлю|оценка) $RatingTwo
        q!: (поставь|ставлю) $RatingTwo звезды
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { rating: 2, title: title } : { rating: 2 };
            var cmd = { type: "smart_app_data", action: { action_id: "rate_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Поставил оценку 2

    state: RateBookThree
        q!: (поставь|ставлю|оценка) $RatingThree $AnyText::bookTitle
        q!: (поставь|ставлю|оценка) $RatingThree
        q!: (поставь|ставлю) $RatingThree звезды
        q!: нормальная книга
        q!: средняя книга
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { rating: 3, title: title } : { rating: 3 };
            var cmd = { type: "smart_app_data", action: { action_id: "rate_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Поставил оценку 3

    state: RateBookFour
        q!: (поставь|ставлю|оценка) $RatingFour $AnyText::bookTitle
        q!: (поставь|ставлю|оценка) $RatingFour
        q!: (поставь|ставлю) $RatingFour звезды
        q!: хорошая книга
        q!: понравилась книга
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { rating: 4, title: title } : { rating: 4 };
            var cmd = { type: "smart_app_data", action: { action_id: "rate_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Поставил оценку 4

    state: RateBookFive
        q!: (поставь|ставлю|оценка) $RatingFive $AnyText::bookTitle
        q!: (поставь|ставлю|оценка) $RatingFive
        q!: (поставь|ставлю) $RatingFive звёзд
        q!: (поставь|ставлю) $RatingFive звезд
        q!: отличная книга
        q!: шедевр
        q!: великолепная книга
        q!: превосходная книга
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { rating: 5, title: title } : { rating: 5 };
            var cmd = { type: "smart_app_data", action: { action_id: "rate_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Поставил оценку 5

    # ────────────────────────────────────────────
    # УДАЛИТЬ ЗАМЕТКУ (должно быть ДО DeleteBook — иначе NLP матчит "удали заметку" на DeleteBook)
    # ────────────────────────────────────────────
    state: DeleteLastNote
        q!: (удали|удалить|убери) заметку
        q!: (удали|удалить|убери) последнюю заметку
        q!: (удали|удалить|убери) эту заметку
        q!: (удали|удалить|убери) последнюю запись
        q!: стёр заметку
        q!: убери запись
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "delete_last_note" } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Удаляю последнюю заметку

    # ────────────────────────────────────────────
    # УДАЛИТЬ КНИГУ
    # ────────────────────────────────────────────
    state: DeleteBook
        q!: (удали|удалить) книгу $AnyText::bookTitle
        q!: (убери|удали) книгу $AnyText::bookTitle из (библиотеки|дневника|списка)
        q!: (удали|удалить) эту книгу
        q!: (удали|удалить) книгу
        q!: удали $AnyText::bookTitle
        q!: убери эту книгу
        q!: убери из библиотеки
        q!: убери из дневника
        q!: удали из библиотеки $AnyText::bookTitle
        q!: удали из дневника $AnyText::bookTitle
        q!: эта книга мне не нужна
        q!: эта книга не интересна
        q!: больше не хочу читать эту книгу
        q!: уберу из списка
        script:
            var title = $parseTree._bookTitle || null;
            var params = title ? { title: title } : {};
            var cmd = { type: "smart_app_data", action: { action_id: "delete_book", parameters: params } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Удаляю книгу

    # ────────────────────────────────────────────
    # ПОКАЗАТЬ ЧИТАЕМЫЕ
    # ────────────────────────────────────────────
    state: ShowReading
        q!: (покажи|открой) $ReadingTrigger
        q!: что я читаю
        q!: что я читаю сейчас
        q!: что сейчас читаю
        q!: что читаю сейчас
        q!: покажи что читаю
        q!: список читаемых книг
        q!: мои текущие книги
        q!: текущие книги
        q!: мои читаемые книги
        q!: открой раздел читаю
        q!: перейди на вкладку читаю
        q!: вкладка читаю
        q!: раздел читаю
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "reading" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю что ты сейчас читаешь

    # ────────────────────────────────────────────
    # ПОКАЗАТЬ ПРОЧИТАННЫЕ
    # ────────────────────────────────────────────
    state: ShowFinished
        q!: (покажи|открой) $FinishedTrigger
        q!: покажи прочитанные книги
        q!: покажи прочитанное
        q!: прочитанные книги
        q!: мои прочитанные книги
        q!: всё что прочитал
        q!: все прочитанные
        q!: что я уже прочитал
        q!: список прочитанных
        q!: список прочитанных книг
        q!: открой раздел прочитано
        q!: перейди на вкладку прочитано
        q!: вкладка прочитано
        q!: раздел прочитано
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "finished" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю прочитанные книги

    # ────────────────────────────────────────────
    # ПОКАЗАТЬ СПИСОК К ПРОЧТЕНИЮ
    # ────────────────────────────────────────────
    state: ShowWishlist
        q!: (покажи|открой) $WishlistTrigger
        q!: покажи список к прочтению
        q!: что я хочу прочитать
        q!: что хочу прочитать
        q!: список к прочтению
        q!: что планирую читать
        q!: что собираюсь прочитать
        q!: мои отложенные книги
        q!: отложенные книги
        q!: список желаний
        q!: мой вишлист
        q!: хочу прочитать список
        q!: открой вкладку хочу прочитать
        q!: вкладка хочу прочитать
        q!: раздел хочу прочитать
        q!: буду читать список
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "wishlist" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю список к прочтению

    # ────────────────────────────────────────────
    # ПОКАЗАТЬ СТАТИСТИКУ
    # ────────────────────────────────────────────
    state: ShowStats
        q!: (покажи|открой) статистику
        q!: покажи мою статистику
        q!: хочу видеть статистику
        q!: сколько я прочитал
        q!: сколько я прочитала
        q!: сколько книг прочитано
        q!: сколько всего прочитано
        q!: сколько книг я прочитал
        q!: сколько книг я прочитала
        q!: мои результаты
        q!: мои достижения
        q!: итоги чтения
        q!: статистика по книгам
        q!: моя статистика
        q!: открой статистику
        q!: раздел статистика
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_stats" } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю статистику

    # ────────────────────────────────────────────
    # ПОИСК ПО ЗАМЕТКАМ
    # ────────────────────────────────────────────
    state: SearchNotes
        q!: найди мои заметки про $AnyText::query
        q!: найди заметки про $AnyText::query
        q!: найди заметки о $AnyText::query
        q!: покажи мои заметки про $AnyText::query
        q!: поищи записи про $AnyText::query
        q!: что я думал про $AnyText::query
        q!: что я думал о $AnyText::query
        q!: что я писал про $AnyText::query
        q!: мои мысли про $AnyText::query
        q!: поиск по заметкам $AnyText::query
        script:
            var query = $parseTree._query;
            var cmd = { type: "smart_app_data", action: { action_id: "search_notes", parameters: { query: query } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Ищу заметки по запросу «{{$parseTree._query}}»

    # ────────────────────────────────────────────
    # ФОЛБЭК
    # ────────────────────────────────────────────
    state: Fallback
        event!: noMatch
        a: Не понял команду. Попробуйте сказать: «добавь книгу», «запиши мысль», «покажи статистику» или «что я сейчас читаю».
