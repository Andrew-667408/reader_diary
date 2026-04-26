patterns:
    $AnyText = $nonEmptyGarbage

theme: /

    state: Fallback
        event!: noMatch
        a: Вы сказали: {{$parseTree.text}}

    state: DeleteAll
        intent!: /delete all
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "delete_all" } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Все задачи удалены

    state: ShowStats
        intent!: /show_stats
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_stats" } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю статистику

    state: ShowReading
        intent!: /show_reading
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "reading" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю что ты сейчас читаешь

    state: ShowFinished
        intent!: /show_finished
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "finished" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю прочитанные книги

    state: ShowWishlist
        intent!: /show_wishlist
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "show_list", parameters: { status: "wishlist" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Показываю список к прочтению

    state: FinishBook
        intent!: /finish_book
        script:
            var cmd = { type: "smart_app_data", action: { action_id: "finish_book" } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Отмечаю книгу как прочитанную

    state: AddNote
        q!: (запиши|добавь|сохрани) (мысль|заметку|цитату|вывод) $AnyText::noteText
        script:
            var text = $parseTree._noteText;
            var cmd = { type: "smart_app_data", action: { action_id: "add_note", parameters: { content: text, type: "thought" } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Записал

    state: AddBook
        q!: (добавь|добавить) книгу $AnyText::bookTitle
        script:
            var title = $parseTree._bookTitle;
            var cmd = { type: "smart_app_data", action: { action_id: "add_book", parameters: { title: title } } };
            $context.response.replies = $context.response.replies || [];
            $context.response.replies.push({ type: "raw", body: { items: [{ command: cmd }] } });
        a: Открываю форму добавления книги
