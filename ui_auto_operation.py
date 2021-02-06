import time
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys


def scroll_down():
    actions = ActionChains(driver)
    element = driver.find_element_by_id("scroll-message-pane")
    actions.move_to_element(element)
    actions.perform()


def rotate():  # いい感じに回す
    src = driver.find_element_by_id("scroll-message")
    ActionChains(driver).drag_and_drop_by_offset(
        src, -5, 5).release().perform()


def bouncing_particle_op():
    driver.find_element_by_id("run_button").click()  # デフォルトのバウンシングボールを実行
    time.sleep(1)

    scroll_down()
    rotate()
    scroll_down()
    time.sleep(1)

    # 構造が変わった時は，デベロッパーツール -> Elementsでクリックしたい場所を選んでCopy full XPathで持ってくれば良い
    # show scale labelを2回押す
    show_scale_label_path = "/html/body/div[2]/div[2]/div[1]/div/ul/li[3]"
    driver.find_element_by_xpath(show_scale_label_path).click()
    time.sleep(1)
    driver.find_element_by_xpath(show_scale_label_path).click()
    time.sleep(1)

    # 1秒間auto rotate
    auto_rotate_path = "/html/body/div[2]/div[2]/div[1]/div/ul/li[5]"
    driver.find_element_by_xpath(auto_rotate_path).click()
    time.sleep(1)
    driver.find_element_by_xpath(auto_rotate_path).click()
    time.sleep(1)

    # XY-modeを2回押す
    xymode_path = "/html/body/div[2]/div[2]/div[1]/div/ul/li[4]"
    driver.find_element_by_xpath(xymode_path).click()
    time.sleep(1)
    driver.find_element_by_xpath(xymode_path).click()
    rotate()
    scroll_down()
    time.sleep(1)

    # plot intervalを0.1 -> 1 -> 0.01と変更
    plot_interval = driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[1]/div/div/div[1]/input")
    plot_interval.clear()
    plot_interval.send_keys("1", Keys.RETURN)
    time.sleep(1)
    plot_interval.clear()
    plot_interval.send_keys("0.01", Keys.RETURN)
    time.sleep(1)

    # line widthを1 -> 2 -> 1と変更
    line_width = driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[2]/div/div/div[1]/input")
    line_width.clear()
    line_width.send_keys("2", Keys.RETURN)
    time.sleep(1)
    line_width.clear()
    line_width.send_keys("1", Keys.RETURN)
    time.sleep(1)

    # y'を描画
    add_new_line = driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[9]")
    add_new_line.click()
    # plot1 x
    driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[10]/div/ul/li[3]/div/ul/li[2]/div/div/input").send_keys("t", Keys.RETURN)
    # plot1 y
    driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[10]/div/ul/li[3]/div/ul/li[3]/div/div/input").send_keys("y'", Keys.RETURN)
    # plot1 z
    driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[10]/div/ul/li[3]/div/ul/li[4]/div/div/input").send_keys("0", Keys.RETURN)
    time.sleep(1)
    # remove
    driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[10]/div/ul/li[3]/div/ul/li[5]").click()
    time.sleep(1)

    # yとy'を描画
    z = driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[10]/div/ul/li[2]/div/ul/li[4]/div/div/input")
    z.clear()
    z.send_keys("y'", Keys.RETURN)
    src = driver.find_element_by_id("scroll-message")
    ActionChains(driver).drag_and_drop_by_offset(
        src, -250, 40).release().perform()
    scroll_down()
    # dynamic draw
    driver.find_element_by_xpath(
        "/html/body/div[2]/div[2]/div[1]/div/ul/li[6]").click()
    time.sleep(20)

    line_width.clear()
    line_width.send_keys("2", Keys.RETURN)
    time.sleep(10)


if __name__ == '__main__':
    try:
        driver = webdriver.Chrome(ChromeDriverManager().install())

        driver.maximize_window()
        driver.get("http://localhost:5000")

        bouncing_particle_op()
    finally:
        driver.quit()
