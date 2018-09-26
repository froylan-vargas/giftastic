$(document).ready(function () {

    var categories = [
        'love',
        'disappointment',
        'happy',
        'sad',
        'anger',
    ];

    var favoriteGifs = [];
    var selectedType = "multiple";
    var currentCategory = '';

    function start() {
        setTheme();
        var storedCategories = getCategoriesFromStorage();
        categories = storedCategories.length > 1 ? storedCategories : categories;
        renderButtons();
        renderStoredFavGifs();
    }

    //Create elements
    function setTheme() {
        var theme = localStorage.getItem('theme');
        if (theme) {
            const body = document.querySelector('body');
            body.style.setProperty('--primaryColor', theme.split('"').join('').trim());
        }
    }

    function renderButtons() {
        categories.forEach(category => {
            createButton(category);
        });
    }

    function getCategoriesFromStorage() {
        var categories = JSON.parse(localStorage.getItem("categories") || "[]");
        return categories;
    }

    function renderStoredFavGifs() {
        favoriteGifs = JSON.parse(localStorage.getItem("favoriteGifs") || "[]");
        favoriteGifs.forEach(gif => {
            appendGifComponent(gif, true);
        })
    }

    function appendGifComponent(gif, isFav = false) {
        const divToChange = !isFav ? "#gifComponents" : "#favoriteGifs";
        var gifComponents = $(divToChange);
        gifComponents.prepend(createGifComponent(gif, isFav));
    }

    function createGifComponent(gif, isFav) {
        const { rating, image, iconsDiv } = createGifComponentElements(gif, isFav);
        var divToReturn = $("<div>").addClass("gifComponent").attr("gifid", gif.id);
        isFav ? divToReturn.append(image, iconsDiv) :
            divToReturn.addClass("col-6 col-sm-4 col-md-3")
                .append(rating, image, iconsDiv);
        return divToReturn;
    }

    function createGifComponentElements(gif, isFav) {
        var rating = $('<p>').text(`Rating: ${gif.rating}`);
        var image = createGifImgElement(gif);
        var iconsDiv = createIconsDiv(gif, isFav);
        return { rating, image, iconsDiv };
    }

    function createGifImgElement(gif) {
        return $('<img>')
            .attr("src", gif.stillUrl)
            .attr("alt", "gif")
            .attr("data-state", "still")
            .attr("data-still", gif.stillUrl)
            .attr("data-animate", gif.animateUrl)
            .addClass("img-fluid")
            .on('click', gifClickHandler)
    }

    function createIconsDiv(gif, isFav) {
        var iconsDiv = $('<div>');
        var { favoriteIcon, downloadIcon, copyIcon } = createIconElements(isFav, gif);
        iconsDiv.append(favoriteIcon, downloadIcon, copyIcon);
        return iconsDiv;
    }

    function createIconElements(isFav, gif) {
        var favoriteIcon = $('<i>');
        !isFav ? favoriteIcon.addClass("icon far fa-heart") : favoriteIcon.addClass("icon far fa-window-close");
        !isFav ? favoriteIcon.on("click", favHandler) : favoriteIcon.on("click", removeFromFavHandler);
        addFavoriteIconAttributes(favoriteIcon, gif);
        var downloadIcon = $('<i>').addClass("icon fas fa-file-download")
            .on("click", iconDownloadHandler);
        addAnimateAttribute(downloadIcon, gif);
        var copyIcon = $('<i>').addClass("icon far fa-copy")
            .on("click", iconCopyHandler);
        addAnimateAttribute(copyIcon, gif);
        return { favoriteIcon, downloadIcon, copyIcon };
    }

    function addFavoriteIconAttributes(favoriteIcon, gif) {
        favoriteIcon.attr("rating", gif.rating)
        favoriteIcon.attr("stillUrl", gif.stillUrl)
        favoriteIcon.attr("animateUrl", gif.animateUrl)
        favoriteIcon.attr("gifid", gif.id)
    }

    function addAnimateAttribute(icon, gif) {
        icon.attr("animateUrl", gif.animateUrl)
    }

    function createButton(category) {
        var categoryButton = $("<button>")
            .addClass("category-button")
            .attr("data-category", category)
            .text(category)
            .on('click', categoryClickHandler);

        var deleteCategoryButton = $("<button>")
            .addClass("btn btn-danger categoryDelete")
            .attr("data-category", category)
            .on("click", onDeleteCategoryHandler)
            .append($('<i>')
                .addClass("far fa-window-close vertical iconDelete"));

        $("#buttons-view").append(categoryButton, deleteCategoryButton);
    }

    //Handlers
    function categoryClickHandler() {
        $("#gifComponents").empty();
        var category = $(this).attr("data-category");
        $("#searchTitle").text(`You search for: ${category}`);
        currentCategory = category;
        const queryUrl = createGiphyUrl(category);
        giphyCall(queryUrl);
    }

    function getTypeHandler() {
        var typeSelected = $(this).val();
        selectedType = typeSelected;
        if (typeSelected === 'multiple') {
            $("#limitRequest").show();
            $("#limitRequest").val("10");
        } else {
            $("#limitRequest").hide();
        }
        actionsForConfigChange();
    }

    function limitRequestHandler(){
        actionsForConfigChange();
    }

    function addCategoryHandler(event) {
        event.preventDefault();
        var category = $("#category-input").val().trim().toLowerCase();
        if (category.length) {
            categories.push(category);
            saveToLocalStorage('categories', categories);
            createButton(category);
            $("#category-input").val("");
        }
    };

    function iconDownloadHandler() {
        var gifUrl = $(this).attr("animateurl");
        if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
            alert("Feature not supported on iOS");
            return;
        }
        $.ajax({
            url: gifUrl,
            method: 'GET',
            xhrFields: {
                responseType: 'blob'
            },
            success: function (data) {
                var a = document.createElement('a');
                var url = window.URL.createObjectURL(data);
                a.href = url;
                a.download = 'gif.gif';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        });
    }

    function iconCopyHandler() {
        var value = $(this).attr("animateurl");
        var $input = $("<input>");
        $("#clipboard").append($input);
        $input.val(value);
        if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
            var el = $input.get(0);
            var editable = el.contentEditable;
            var readOnly = el.readOnly;
            el.contentEditable = true;
            el.readOnly = true;
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            el.setSelectionRange(0, 999999);
            el.contentEditable = editable;
            el.readOnly = readOnly;
        } else {
            $input.select();
        }
        document.execCommand("copy");
        $input.remove();
    }

    function gifClickHandler() {
        var gif = $(this);
        var gifState = gif.attr("data-state");
        switchGifState(gifState, gif);
    }

    function favHandler() {
        const id = $(this).attr("gifId");
        if (!isInFavorites(id)) {
            const rating = $(this).attr("rating");
            const stillUrl = $(this).attr("stillUrl");
            const animateUrl = $(this).attr("animateUrl");
            const gif = { id, stillUrl, animateUrl, rating };
            favoriteGifs.push(gif);
            saveToLocalStorage('favoriteGifs', favoriteGifs);
            appendGifComponent(gif, true);
        } else {
            alert("Gif already in favorites");
        }
    }

    function removeFromFavHandler() {
        var gifId = $(this).attr("gifId");
        favoriteGifs = deleteFromArrayById(favoriteGifs, gifId);
        var elementToDelete = $(`#favoriteGifs div.gifComponent[gifid = "${gifId}"]`);
        elementToDelete.remove();
        saveToLocalStorage('favoriteGifs', favoriteGifs);
    }

    function onDeleteCategoryHandler() {
        var category = $(this).attr("data-category");
        $(`#buttons-view [data-category='${category}']`).remove();
        categories = deleteFromArrayElement(categories, category);
        saveToLocalStorage('categories', categories);
    }

    function brandHandler() {
        const body = document.querySelector('body');
        const currentColor = body.style.getPropertyValue('--primaryColor');
        if (currentColor !== 'black') {
            body.style.setProperty('--primaryColor', "black");
            saveToLocalStorage('theme', 'black');
        } else {
            body.style.setProperty('--primaryColor', "#fb1");
            saveToLocalStorage('theme', '#fb1');
        }
    }

    //Helpers
    function isInFavorites(id) {
        return favoriteGifs.filter(fav => {
            return fav.id === id;
        }).length > 0
    }

    function actionsForConfigChange(){
        if (currentCategory) {
            $("#gifComponents").empty();
            const queryUrl = createGiphyUrl(currentCategory);
            giphyCall(queryUrl);
        }
    }

    function switchGifState(gifState, gif) {
        var attributeFilter = gifState === "still" ? "animate" : "still";
        var src = gif.attr(`data-${attributeFilter}`);
        gif.attr({ src });
        gif.attr("data-state", attributeFilter);
    }

    function saveToLocalStorage(key, element) {
        localStorage.setItem(key, JSON.stringify(element));
    }

    function deleteFromArrayById(array, id) {
        return array.filter(elem => {
            return elem.id !== id;
        });
    }

    function deleteFromArrayElement(array, element) {
        return array.filter(elem => {
            return elem !== element
        });
    }

    function isRandomTypeSelected() {
        return selectedType === 'random';
    }

    function getGiphyQueryMethod() {
        return isRandomTypeSelected() ? "random" : "search";
    }

    //GiphyAPI
    function createGiphyUrl(category) {
        var giphyUrl = "https://api.giphy.com/v1/gifs/"
        const queryMethod = getGiphyQueryMethod();
        const key = "dc6zaTOxFJmzC";
        if (!isRandomTypeSelected()) {
            const limit = $("#limitRequest").val();
            giphyUrl += `${queryMethod}?api_key=${key}&q=${category}&limit=${limit}`;
        } else {
            giphyUrl += `${queryMethod}?api_key=${key}&tag=${category}`;
        }
        return giphyUrl;
    }

    function giphyCall(queryUrl) {
        $.ajax({
            url: queryUrl,
            method: 'GET'
        }).then(giphyResponseHandler);
    }

    function giphyResponseHandler(gifs) {
        if (isRandomTypeSelected()) {
            appendGifComponent(createResponseGifObject(gifs.data));
        } else {
            gifs.data.forEach(gif => {
                appendGifComponent(createResponseGifObject(gif));
            });
        }
    }

    function createResponseGifObject(gif) {
        const rating = gif.rating ? gif.rating : "NOT PROVIDED";
        return {
            id: gif.id,
            stillUrl: gif.images.fixed_height_still.url,
            animateUrl: gif.images.downsized.url,
            rating
        }
    }

    //Bindings
    $("#brand").on("click", brandHandler);
    $("#add-category").on("click", addCategoryHandler);
    $("#getType").on("change", getTypeHandler);
    $("#limitRequest").on("change", limitRequestHandler);
    start();
});



